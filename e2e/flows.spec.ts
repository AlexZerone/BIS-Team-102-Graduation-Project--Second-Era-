import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { DEMO, DEMO_PASSWORD } from "../scripts/demo-accounts";

// Each test starts signed out in a fresh browser context, against the seeded e2e database.

async function login(page: Page, email: string, password = DEMO_PASSWORD) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("training to hiring: submit, get graded, earn a certificate, apply, get ranked", async ({ page }) => {
  await login(page, DEMO.midwayStudent);
  await expect(page.getByText("Continue where you left off")).toBeVisible();
  await page.getByRole("link", { name: "Continue course" }).click();

  // "Monthly revenue report" is already submitted; "Top customers" is the one left.
  const form = page.locator("form", { has: page.getByRole("button", { name: "Submit", exact: true }) });
  await form.getByLabel("Your answer").fill("SELECT customer_id, sum(total) FROM orders GROUP BY 1 ORDER BY 2 DESC LIMIT 10;");
  await form.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(page.getByText("Submitted.")).toBeVisible();

  await login(page, DEMO.instructor);
  await page.goto("/teach/1/grade");
  for (let i = 0; i < 2; i++) {
    const ungraded = page.locator("form", { has: page.getByRole("button", { name: "Save grade" }) }).first();
    await ungraded.getByLabel(/Score/).fill("45");
    await ungraded.getByRole("button", { name: "Save grade" }).click();
    await expect(page.getByText(/^Graded\./).nth(i)).toBeVisible();
  }
  await expect(page.getByText("Graded. The student passed with 90% and received a certificate.")).toBeVisible();

  await login(page, DEMO.midwayStudent);
  await page.goto("/jobs/1");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Application sent.")).toBeVisible();

  await login(page, DEMO.company);
  await page.goto("/company/jobs/1");
  await expect(page.getByRole("heading", { name: /Nour Ibrahim/ })).toBeVisible();
});

test("a new company waits for approval, then can post jobs", async ({ page }) => {
  const email = `talent-${Date.now()}@example.test`;
  await page.goto("/register");
  await page.getByLabel("I'm hiring").check();
  await page.getByLabel("Company name").fill("Pyramid Analytics");
  await page.getByLabel("Full name").fill("Laila Samir");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("e2e-test-password-1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/waiting for admin approval/)).toBeVisible();

  await page.goto("/company/jobs/new");
  await expect(page).toHaveURL(/\/dashboard$/); // pending accounts can't post yet

  await login(page, DEMO.admin);
  const card = page.locator("div", { hasText: email }).filter({ has: page.getByRole("button", { name: "Approve" }) }).last();
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(card.getByText("Approved.")).toBeVisible();

  await login(page, email, "e2e-test-password-1");
  await page.goto("/company/jobs/new");
  await expect(page.getByRole("heading", { name: "Post a job" })).toBeVisible();
});

test("password reset works once and signs the user in", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(DEMO.certifiedStudent);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/we've sent a reset link/)).toBeVisible();

  const mail = readFileSync(".data/e2e-mail.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((m) => m.to === DEMO.certifiedStudent).at(-1);
  const link = mail.text.match(/http:\/\/localhost:3100\/reset-password\/\S+/)[0];

  await page.goto(link);
  await page.getByLabel("New password").fill("brand-new-password-1");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("heading", { name: "Welcome, Sara Ali" })).toBeVisible();

  await page.goto(link);
  await expect(page.getByText("This reset link has expired or was already used.")).toBeVisible();
  await login(page, DEMO.certifiedStudent, "brand-new-password-1");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("pages are protected by role, and sign-in returns to the page you wanted", async ({ page }) => {
  await page.goto("/learn/1");
  await expect(page).toHaveURL(/\/login\?next=%2Flearn%2F1$/);

  await login(page, DEMO.midwayStudent);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/company/jobs/new");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("Arabic switches the whole page to right-to-left", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "العربية" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("link", { name: "أنشئ حساباً مجانياً" })).toBeVisible();

  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: "الدورات", level: 1 })).toBeVisible();
  await expect(page.getByText("SQL for Business Analysts")).toBeVisible(); // course content stays as written

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("phones get a menu and the main action near the top @mobile", async ({ page }) => {
  await page.goto("/courses/2");
  await expect(page.getByRole("link", { name: "Sign up to enroll" })).toBeInViewport();
  await page.getByText("Menu").click();
  await page.getByRole("link", { name: "Jobs" }).click();
  await expect(page).toHaveURL(/\/jobs$/);
  await expect(page.getByText("Menu")).toBeVisible(); // closed again after navigating
});
