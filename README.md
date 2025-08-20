<h1 align="center">
    <img src="https://github.com/Bonnnana/chatbot-assistant/blob/main/chrome-extension/public/finki_logo_darkk.png" height="350" width="375" alt="banner" /><br>
</h1>


## FINKI AI Assistant

**FINKI AI Assistant** is an open-source AI web automation tool that runs directly in your browser.  
It is specialized for **FINKI Faculty services** with flexible LLM options and a multi-agent system.

## 📊 Key Features

- **Multi-agent System**: Navigator, Planner & Validator collaborate to complete complex workflows.
- **Multiple LLM Support**: Assign different models to different agents.
- **Interactive Side Panel**: Chat UI with real-time updates.  
- **Conversation History**: Manage interaction history easily.  

#### 🎓 Consultation Booking 
- Automatic navigation to the correct consultations page: [https://consultations.finki.ukim.mk/](https://consultations.finki.ukim.mk/)  
- Book consultations directly with a **named professor** (e.g., *"Schedule a consultation with Prof. Trajanov"*)  
- Lets you **ask questions about consultations**, such as:  
  - *"What are my scheduled consultations?"*  
  - *"Show me the earliest available consultation for Prof. Trajanov"*  
- If multiple professors or slots are found, it will **ask you to choose** 

#### 📑 iKnow
- Automatic navigation to the correct iKnow page: [https://www.iknow.ukim.mk/](https://www.iknow.ukim.mk/)  
- Handles **document request flow**
- Lets you **ask questions about personal informations for the student**
- Lets you **ask questions about average grade, passed exams etc...**

#### 📚 Courses & Assignments 
- Automatic navigation to the correct iKnow page: [https://www.courses.finki.ukim.mk/](https://www.courses.finki.ukim.mk)  
- Smart course search by **subject name or abbreviation** 
- Extracts **deadlines, homework, surveys, and exams** directly from course calendars  
- Supports **date-based queries** like:  
  - *"Show all homework for this month"*  
  - *"Are there any surveys for next month?"*

## 🛠️ Build from Source

1. **Prerequisites**:
   * [Node.js](https://nodejs.org/) (v22.12.0 or higher)
   * [pnpm](https://pnpm.io/installation) (v9.15.1 or higher)

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/Bonnnana/chatbot-assistant.git
   cd chatbot-assistant
   ```

3. **Install Dependencies**:
   ```bash
   pnpm install
   ```

4. **Build the Extension**:
   ```bash
   pnpm build
   ```

5. **Load the Extension**:
   * The built extension will be in the `dist` directory
   * Open `chrome://extensions/` in Chrome
   * Enable `Developer mode` (top right)
   * Click `Load unpacked` (top left)
   * Select the dist directory

6. **Configure Agent Models**
    * Open the `Settings` icon.
    * Add your LLM API keys.
    * Choose which model to use for different agents (Navigator, Planner, Validator)

> **Note**: In this project we have used OpenAI API key, model: gpt 4.1-mini had best performance for all 3 agents.

## 🔄 Keeping FINKI AI Assistant Updated with Nanobrowser

FINKI AI Assistant is built on top of [Nanobrowser](https://github.com/nanobrowser/nanobrowser).  
To stay up to date with the latest Nanobrowser improvements **while keeping our custom FINKI workflows and prompt design**, we maintain a clean link to the upstream repository.

### 🌐 Remote Setup

In our Git workflow, we use **two remotes**:

- **origin** → our repository (FINKI AI Assistant)  
- **upstream** → the official Nanobrowser repository (read-only, fetch only)

This setup allows us to **pull updates from Nanobrowser** while keeping all pushes limited to our own repo.

```bash
# Add Nanobrowser as upstream (only once)
git remote add upstream https://github.com/nanobrowser/nanobrowser.git

# Verify remotes
git remote -v
# origin    https://github.com/Bonnnana/chatbot-assistant.git (our repo)
# upstream  https://github.com/nanobrowser/nanobrowser.git     (Nanobrowser official)

---

## Fetch Latest Changes from Upstream

Download the latest commits from the upstream repository without modifying your local files:

```bash
git fetch upstream
```

This command:
- Downloads new commits, branches, and tags from upstream
- Does NOT change any of your local files
- Makes upstream changes available for merging/rebasing

---

## Update Your Local Main Branch

Switch to your main branch and apply the upstream changes.

###  Rebase

```bash
git checkout main
git rebase upstream/main
```

## Push Updates to Your Repository

After updating your local branch, push the changes to your forked repository:

```bash
git push --force-with-lease origin main
```

**Why `--force-with-lease`?**
- Rebase rewrites commit history, requiring a force push
- `--force-with-lease` is safer than `--force` - it prevents overwriting others' work

---

## Handling Conflicts

If you encounter merge conflicts during rebase:

1. **Review the conflicts** - Git will mark conflicted files
2. **Edit conflicted files** - Choose which changes to keep
3. **Mark conflicts as resolved:**
   ```bash
   git add <conflicted-file>
   ```
4. **Continue the process:**
   - `git rebase --continue`

---









