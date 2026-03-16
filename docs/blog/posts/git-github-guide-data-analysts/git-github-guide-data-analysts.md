---
authors:
  - rv
categories:
  - AI Tooling
  - Analytics Leadership
comments: true
date: 2025-10-19
description: A step-by-step guide to Git and GitHub for data analysts, covering setup, core commands, branching, pull requests, and the business case for adoption.
draft: false
slug: git-github-guide-data-analysts
tags:
  - git
  - github
  - version control
  - analytics
  - data analyst
  - collaboration
---

# The Practical Git and GitHub Guide Every Data Analyst Should Start With

**TL;DR:** Git is version control software that runs locally on your machine. GitHub is the cloud service you push your code to. Together, they give your analytics team a single source of truth, a safety net for experiments, and a peer-review process that catches errors before they hit production. This guide covers the setup, the core workflow, and why adopting these tools is one of the highest-ROI decisions your analytics team can make this year.

<!-- more -->

Most data analysts spend years building SQL queries, Python scripts, and dashboards without version control. Then one overwritten file or corrupted script costs a full day's work, and the question "why didn't I start this sooner?" becomes very easy to answer.

Git and GitHub solve that problem. They are not just for software engineers. Any analyst who writes code, runs transformations, or shares scripts with teammates will benefit from using them. This guide walks you through the setup, the core workflow, and the business case you can take to your leadership.

---

## Git and GitHub Are Not the Same Tool

**Git is version control software that runs locally on your machine. GitHub is a cloud service that hosts your Git repository online and adds team collaboration features.** They are two separate products, developed independently. You can use Git without GitHub.

Here is the simplest way to think about it: Git is the save system. GitHub is the cloud drive.

Git was created by Linus Torvalds in 2005 to manage the Linux kernel codebase after the previous tool became unavailable. GitHub launched in 2008 as a hosting platform built on top of Git. Microsoft acquired it in 2018 for $7.5 billion because it had become the default home for the world's code.

The distinction matters in practice. Git tracks your code history on your machine. GitHub makes that history accessible from anywhere and adds features like pull requests, issue tracking, and team access controls. You need to understand one before the other makes sense.

---

## How to Set Up Your First Repository in 10 Minutes

Before anything else, install Git. On Windows, download the installer from the official Git website and run it. During installation, when asked about your default editor, switch it to VS Code rather than the default Vim.

On macOS, run `git --version` in your terminal and it will prompt you to install if needed. Linux distributions include Git by default.

Once installed, you initialise a repository inside any project folder.

**Step 1: Create a project folder and navigate into it.**

```bash
mkdir my-analytics-project
cd my-analytics-project
```

**Step 2: Initialise a Git repository.**

```bash
git init
```

This creates a hidden `.git` folder inside your project. That folder is Git's brain: it stores every version of every file you commit. Never delete it manually.

**Step 3: Create a file, then check the status.**

```bash
git status
```

You will see your file listed as "untracked." Git knows it exists, but has not saved a snapshot of it yet.

**Step 4: Stage and commit the file.**

```bash
git add .
git commit -m "Initial commit: add project setup"
```

`git add .` stages everything in the folder. `git commit -m` saves the snapshot with a message. Every commit needs a message. Keep them short and specific. "Add sales attribution model v1" is better than "changes."

**Step 5: Connect to GitHub and push.**

Create a new repository on GitHub (click "New repository," give it a name, leave it empty). Then run:

```bash
git remote add origin https://github.com/your-username/my-analytics-project.git
git push -u origin main
```

Your code is now on GitHub. Anyone you grant access to can pull it down in seconds.

!!! note "Windows copy-paste in Git Bash"
    In Git Bash on Windows, standard copy-paste shortcuts do not work. Use `Ctrl+Insert` to copy and `Shift+Insert` to paste. It is unusual but consistent once you know it.

---

## The Four Commands You Will Use Every Day

**The day-to-day Git workflow runs on four commands: `git status`, `git add`, `git commit`, and `git push`. Learn these four and you have 80% of what you need to operate effectively.**

Here is what each one does:

- **`git status`:** Shows which files have changed, which are staged, and which branch you are on. Run this constantly. It is free information.
- **`git add [file]` or `git add .`:** Moves changes into the staging area. Think of staging as "selected for the next snapshot." You can stage individual files if you want to commit changes separately.
- **`git commit -m "message"`:** Saves the staged snapshot to your local repository. This is your save point. It does not send anything to GitHub.
- **`git push`:** Sends your local commits to GitHub. Until you push, your changes exist only on your machine.

The habit to build: status, add, commit, push. In that order. Every time.

One common mistake: running `git commit` without the `-m` flag opens a separate text editor unexpectedly. Always include `-m "your message"` and you will never hit that.

---

## Why Branches Stop Your Team From Breaking Each Other's Work

**A branch is an isolated copy of the codebase where you can make changes without touching the stable version. When your work is ready, you merge it back in.** Three analysts can work on the same project simultaneously without overwriting each other.

Here is how to use them:

```bash
# Create a new branch and switch to it
git checkout -b feature/new-churn-model

# Do your work, then add and commit as normal
git add .
git commit -m "Add churn model v2 with updated feature set"

# Switch back to main and merge
git checkout main
git merge feature/new-churn-model
```

The main branch is your source of truth. Nothing untested belongs there.

Branches also mean you can experiment freely. If the experiment fails, you delete the branch and main is untouched. If it works, you merge. This is how you build a practice of iterating without fear of losing stable work.

!!! tip "Name branches by purpose"
    Use a consistent naming pattern: `feature/`, `fix/`, or `experiment/`. It makes the branch list readable and signals what work is in progress without anyone needing to ask.

---

## Pull Requests Are Your Code Review Gate

A pull request, or PR, is a GitHub feature (not a Git command) that creates a formal review step before a branch is merged into main. It is where you ask a teammate to check your work before it becomes permanent.

To raise one: push your branch to GitHub, then in the repository interface click "Compare & pull request." A diff view shows every line you changed. Your reviewer can comment on specific lines, request changes, or approve and merge.

For analytics teams, this is where significant value sits. A second pair of eyes on a SQL query before it runs in production catches a bad join condition. A review of a Python model catches a hardcoded date that will break next quarter. The PR process is lightweight to set up and expensive not to have.

Pull requests also create a permanent record. Every change, who made it, when, and why, is visible in the repository history. For teams operating in regulated industries, that audit trail is not optional, and GitHub provides it automatically with no extra effort.

---

## The Business Case Your Leadership Needs to Hear

**The ROI of Git and GitHub for analytics teams comes from three areas: fewer production errors caught by peer review, faster onboarding for new team members, and complete audit trails for compliance.** The cost of not having version control is harder to see, but it compounds.

Consider what happens without it:

- **Version chaos:** Five files named `final_model_v2_FINAL_USE_THIS.py` on a shared drive, and nobody knows which one actually ran in production last quarter.
- **Fragile knowledge:** The analyst who built the pricing model left the team. Her code is on a laptop no one can access. Nobody else knows how it works.
- **No review gate:** A broken SQL query runs in production. The error shows up in the board report three weeks after the fact.

With Git and GitHub, all three become structural impossibilities rather than recurring risks.

The productivity numbers are concrete. A new analyst joining a team with a well-maintained GitHub repository can clone the entire codebase, read the commit history, and understand how every major model was built, without a single handover meeting. At a previous organisation, adopting Git across the analytics team cut new-joiner onboarding time from two weeks to three days.

For teams in regulated industries, the compliance case is equally clear. Model governance frameworks increasingly require evidence of change control and version history. A GitHub repository provides both, automatically, from day one.

---

## Your Turn

You do not need to adopt everything at once. Here is where to start this week:

1. **Install Git and run `git init` in one existing project folder.** Stage and commit the current state. That one commit is your first save point and costs you about ten minutes.
2. **Create a free GitHub account and push your new repository.** Your code now has a remote backup and a URL you can share with a teammate.
3. **On your next piece of work, create a branch instead of editing main directly.** Build the habit before you need it in a team setting.

If you lead an analytics team, run a one-hour onboarding session for the group. The learning curve is real but short. Every team I have seen adopt these tools finds its footing within one sprint cycle.

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

P.S. The most common reason analytics teams skip Git is "we are not software developers." Neither was the presenter I learnt from, four years into his data analyst career and still managing scripts as local file copies. These tools do not care about your job title. They care that your work does not disappear.
