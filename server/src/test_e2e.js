const BASE_URL = 'http://localhost:5000/api';

async function req(url, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('🧪 Starting EquiSplit Comprehensive End-to-End Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // 1. Health check
  console.log('--- 1. Health & Server Check ---');
  const health = await req('/health');
  assert(health.status === 200 && health.data.status === 'ok', 'API health check returns 200 OK');

  // 2. Authentication
  console.log('\n--- 2. Authentication & Authorization ---');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'rahul@example.com', password: 'password123' }),
  });
  assert(loginRes.status === 200 && loginRes.data.data.token, 'Login with valid credentials returns JWT');
  const rahulToken = loginRes.data?.data?.token;
  const rahulId = loginRes.data?.data?._id;

  const badLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'rahul@example.com', password: 'wrongpassword' }),
  });
  assert(badLogin.status === 401, 'Login with invalid password correctly rejected (401)');

  const testUserEmail = `testuser_${Date.now()}@example.com`;
  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'E2E Tester', email: testUserEmail, password: 'password123' }),
  });
  assert(regRes.status === 201 && regRes.data.data.token, 'Register new user returns 201 Created');
  const testerToken = regRes.data?.data?.token;
  const testerId = regRes.data?.data?._id;

  // 3. Group Creation & Invite Codes
  console.log('\n--- 3. Group Management & Workflows ---');
  const groupRes = await req('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Manali Trek 2026',
      description: 'Mountain trail trip with friends',
      currency: 'INR',
      category: 'Trip',
    }),
  }, rahulToken);
  assert(groupRes.status === 201, 'Create group returns 201');
  const group = groupRes.data?.data;
  assert(group?.inviteCode && group.inviteCode.length === 6, `Generated 6-character invite code: ${group?.inviteCode}`);

  // Join group via invite code
  const joinRes = await req('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode: group.inviteCode }),
  }, testerToken);
  assert(joinRes.status === 200, 'Tester joined group via 6-character invite code');

  // Duplicate join attempt
  const dupJoin = await req('/groups/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode: group.inviteCode }),
  }, testerToken);
  assert(dupJoin.status === 400, 'Duplicate join rejected with 400 error');

  // Add third member (Priya)
  const loginPriya = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'priya@example.com', password: 'password123' }),
  });
  const priyaToken = loginPriya.data?.data?.token;
  const priyaId = loginPriya.data?.data?._id;

  await req(`/groups/${group._id}/members`, {
    method: 'POST',
    body: JSON.stringify({ email: 'priya@example.com' }),
  }, rahulToken);

  // 4. Split Engine & Penny Precision
  console.log('\n--- 4. Split Engine & Remainder Math Validation ---');
  // Equal Split: ₹100 among 3 people
  const expEqual = await req(`/groups/${group._id}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Campfire Snacks',
      amount: 100,
      currency: 'INR',
      paidBy: [{ user: rahulId, amount: 100 }],
      splitType: 'equal',
      splits: [{ user: rahulId }, { user: testerId }, { user: priyaId }],
      category: 'food',
    }),
  }, rahulToken);
  assert(expEqual.status === 201, 'Equal split expense created');
  const splitsEq = expEqual.data?.data?.splits || [];
  const sumEq = splitsEq.reduce((acc, s) => acc + s.amount, 0);
  assert(Math.abs(sumEq - 100) < 0.001, `Remainder penny adjusted: splits sum ${sumEq.toFixed(2)} === 100.00`);

  // Exact Split Validation (Fails if sum != total)
  const badExact = await req(`/groups/${group._id}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Tent Rental',
      amount: 500,
      currency: 'INR',
      paidBy: [{ user: rahulId, amount: 500 }],
      splitType: 'exact',
      splits: [
        { user: rahulId, amount: 200 },
        { user: testerId, amount: 200 }, // sum = 400 != 500
      ],
      category: 'housing',
    }),
  }, rahulToken);
  assert(badExact.status === 400, 'Exact split correctly rejected when shares do not sum to total');

  // Exact Split (Valid)
  const goodExact = await req(`/groups/${group._id}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Tent Rental',
      amount: 500,
      currency: 'INR',
      paidBy: [{ user: rahulId, amount: 500 }],
      splitType: 'exact',
      splits: [
        { user: rahulId, amount: 200 },
        { user: testerId, amount: 150 },
        { user: priyaId, amount: 150 },
      ],
      category: 'housing',
    }),
  }, rahulToken);
  assert(goodExact.status === 201, 'Exact split accepted when shares strictly sum to 500.00');

  // Percentage Split Validation (Fails if sum != 100)
  const badPct = await req(`/groups/${group._id}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Guide Fee',
      amount: 1200,
      currency: 'INR',
      paidBy: [{ user: testerId, amount: 1200 }],
      splitType: 'percentage',
      splits: [
        { user: rahulId, percentage: 40 },
        { user: testerId, percentage: 40 }, // sum = 80 != 100
      ],
      category: 'other',
    }),
  }, testerToken);
  assert(badPct.status === 400, 'Percentage split rejected when sum != 100%');

  // Percentage Split (Valid)
  const goodPct = await req(`/groups/${group._id}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      description: 'Guide Fee',
      amount: 1200,
      currency: 'INR',
      paidBy: [{ user: testerId, amount: 1200 }],
      splitType: 'percentage',
      splits: [
        { user: rahulId, percentage: 50 },
        { user: testerId, percentage: 25 },
        { user: priyaId, percentage: 25 },
      ],
      category: 'other',
    }),
  }, testerToken);
  assert(goodPct.status === 201, 'Percentage split accepted when percentages sum to 100%');

  // 5. Debt Simplification & Balances
  console.log('\n--- 5. Debt Simplification & Balances ---');
  const balRes = await req(`/groups/${group._id}/balances`, {}, rahulToken);
  assert(balRes.status === 200, 'Fetch group balances returns 200');
  const balData = balRes.data?.data;
  assert(Array.isArray(balData?.simplifiedTransfers), `Simplified transfers computed: ${balData?.simplifiedTransfers?.length} transfers`);
  assert(Array.isArray(balData?.balances), `Member balances derived for ${balData?.balances?.length} members`);

  // 6. Natural Business Logic: Prevent Removing Member with Unsettled Balance
  console.log('\n--- 6. Natural Safety Guard: Member Removal with Debt ---');
  const removeRes = await req(`/groups/${group._id}/members/${testerId}`, {
    method: 'DELETE',
  }, rahulToken);
  assert(
    removeRes.status === 400 && removeRes.data.message.includes('settle all balances first'),
    `Prevented removing indebted member: "${removeRes.data.message}"`
  );

  // 7. Settle Up Workflow
  console.log('\n--- 7. Settle Up Payment Recording ---');
  const transfer = balData?.simplifiedTransfers?.[0];
  if (transfer) {
    const settleRes = await req(`/groups/${group._id}/settlements`, {
      method: 'POST',
      body: JSON.stringify({
        toUserId: transfer.toUserId || transfer.to?._id,
        amount: transfer.amount,
        currency: 'INR',
        notes: 'E2E Test UPI payment',
      }),
    }, rahulToken);
    assert(settleRes.status === 201, `Recorded settlement payment of ₹${transfer.amount}`);
  }

  // 8. Analytics & Audit Activity
  console.log('\n--- 8. Analytics & Audit Trail ---');
  const anaRes = await req(`/groups/${group._id}/analytics`, {}, rahulToken);
  assert(anaRes.status === 200 && anaRes.data.data.categoryBreakdown.length > 0, 'Analytics category breakdown verified');

  const actRes = await req(`/groups/${group._id}/activity`, {}, rahulToken);
  assert(actRes.status === 200 && actRes.data.data.length >= 4, `Activity log verified with ${actRes.data.data.length} audit entries`);

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} / ${total} assertions PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`========================================\n`);

  process.exit(passed === total ? 0 : 1);
}

runTests().catch(e => {
  console.error('Test run failed:', e);
  process.exit(1);
});
