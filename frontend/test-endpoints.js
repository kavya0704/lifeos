const axios = require("axios");

const API_URL = "http://localhost:5000/api";
const email = `test.user.${Math.floor(Math.random() * 100000)}@example.com`;
const password = "Password123!";
let token = "";

async function runTests() {
  console.log("🚀 Starting LifeOS Endpoint Integration Tests...\n");

  try {
    // 1. Health Check
    console.log("🔍 Checking API Health...");
    const health = await axios.get(`${API_URL}/health`);
    console.log("✅ API Health status:", health.data.status, "\n");

    // 2. Register
    console.log(`👤 Registering user with email: ${email}...`);
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Runner",
      email,
      password,
    });
    console.log("✅ Registration Successful. User ID:", regRes.data.user.id, "\n");

    // 3. Login
    console.log("🔑 Logging in to retrieve JWT token...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    token = loginRes.data.token;
    console.log("✅ Login Successful. Token length:", token.length, "\n");

    // Pre-configure axios client with Auth header
    const client = axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    // 4. Update Profile (Onboarding)
    console.log("📝 Submitting onboarding preferences...");
    const profileRes = await client.put("/auth/profile", {
      wakeTime: "07:00",
      sleepTime: "23:00",
      englishLevel: "Fluent",
      gymSchedule: ["Monday", "Wednesday", "Friday"],
      weakAreas: ["Time Management", "Procrastination"],
      strongAreas: ["Coding", "Mathematics"],
      subjects: ["Computer Science", "Physics"],
    });
    console.log("✅ Onboarding settings updated. Level:", profileRes.data.user.level, "XP:", profileRes.data.user.xp, "\n");

    // 5. Create Habit
    console.log("🔥 Creating a daily habit Monitored Habit...");
    const habitRes = await client.post("/habits", {
      name: "Exercise 30 mins",
    });
    const habitId = habitRes.data.habit.id;
    console.log("✅ Habit Created:", habitRes.data.habit.name, `(ID: ${habitId})`, "\n");

    // 6. Complete Habit
    console.log("🔥 Logging habit completion...");
    const logHabitRes = await client.post(`/habits/${habitId}/log`);
    console.log("✅ Habit Completed today. Streak:", logHabitRes.data.streak, "\n");

    // 7. Create Goal
    console.log("🎯 Creating a weekly goal...");
    const goalRes = await client.post("/goals", {
      title: "Build the AI Coach Integration",
      description: "Ensure Llama 3 answers correctly",
      priority: "HIGH",
      period: "WEEKLY",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const goalId = goalRes.data.goal.id;
    console.log("✅ Goal Created:", goalRes.data.goal.title, `(ID: ${goalId})`, "\n");

    // 8. Create Task
    console.log("📋 Creating a pending task...");
    const taskRes = await client.post("/tasks", {
      title: "Write automated API tests",
      scheduledDate: new Date().toISOString().split("T")[0],
      startTime: "14:00",
      duration: 45,
    });
    const taskId = taskRes.data.task.id;
    console.log("✅ Task Created:", taskRes.data.task.title, `(ID: ${taskId})`, "\n");

    // 9. Complete Task
    console.log("📋 Completing task...");
    const compTaskRes = await client.patch(`/tasks/${taskId}/complete`);
    console.log("✅ Task Marked Complete:", compTaskRes.data.task.completed, "\n");

    // 10. Log Activity
    console.log("⚡ Logging focus hours activity...");
    const actRes = await client.post("/activities", {
      type: "CODING",
      duration: 120,
      notes: "Wrote axios integration script",
    });
    console.log("✅ Activity Logged. Type:", actRes.data.activity.type, "Minutes:", actRes.data.activity.duration, "\n");

    // 11. Fetch today's summary
    console.log("📊 Fetching activity summaries...");
    const sumRes = await client.get("/activities/summary");
    console.log("✅ Summary loaded:", JSON.stringify(sumRes.data.summary), "\n");

    // 12. Test AI Chat
    console.log("🤖 Conversing with AI Coach (Groq/Llama 3)...");
    const chatRes = await client.post("/ai/chat", {
      messages: [
        { role: "user", content: "Hi coach! How can I make my daily coding habits stick?" }
      ]
    });
    console.log("✅ AI Coach reply loaded:");
    console.log("-----------------------------------------------------------------");
    console.log(chatRes.data.response.trim());
    console.log("-----------------------------------------------------------------\n");

    // 13. Test AI Schedule generation
    console.log("🤖 Generating today's schedule using AI...");
    const schedRes = await client.post("/ai/schedule");
    console.log(`✅ AI Schedule successfully generated. Created ${schedRes.data.tasks.length} tasks:`);
    schedRes.data.tasks.forEach((t) => {
      console.log(`   - [${t.startTime}] ${t.title} (${t.duration} min)`);
    });
    console.log();

    // 14. Test Daily Review
    console.log("🏆 Running AI Daily Performance Review evaluation...");
    const reviewRes = await client.post("/ai/review");
    console.log("✅ Daily Review completed. Evaluation Scores:");
    console.log("   - Productivity:", reviewRes.data.review.productivityScore);
    console.log("   - Discipline:", reviewRes.data.review.disciplineScore);
    console.log("   - Consistency:", reviewRes.data.review.consistencyScore);
    console.log("✅ XP Gained:", reviewRes.data.xpAwarded, "New level status:", `Level ${reviewRes.data.level} (${reviewRes.data.xp} XP)`);
    console.log("\n✅ ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Test Failed!");
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error("Response data:", JSON.stringify(error.response.data));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runTests();
