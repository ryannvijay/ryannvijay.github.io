---
authors:
  - rv
categories:
  - Data Strategy
  - AI Tooling
comments: true
date: 2025-05-18
description: How to build data pipelines in Azure Data Factory and analyse data in Azure Synapse Analytics without getting lost in the UI or building architecture you will regret.
draft: false
slug: azure-for-data-analysts-part-2-pipelines-analytics
tags:
  - Azure
  - data pipelines
  - Azure Data Factory
  - Azure Synapse
  - ETL
  - data transformation
---

# Microsoft Azure for Data Analysts Part 2: Building Pipelines and Analysing Data

**TL;DR:** Azure Data Factory and Azure Synapse Analytics are where analytics actually happens: moving data from sources to destinations and writing queries that deliver insights. Most analysts treat them as black boxes. This article walks you through building your first pipeline without overthinking architecture, and setting up Synapse notebooks so you can analyse data alongside SQL queries and Python code without context switching.

<!-- more -->

You have storage and databases set up. You have permissions configured. Now you are staring at Azure's UI thinking, "I have blob containers full of raw data. How do I get this into a database where I can query it?"

Welcome to pipelines. This is where most analysts feel lost because Azure offers too many ways to do the same thing and very little guidance on which path to take.

This is Part 2 of the Azure series. We will cover data pipelines (how data moves between sources and destinations) and analytics workspaces (where you write queries and build notebooks). By the end, you will have moved data from storage into a database, transformed it, and written SQL queries that run without your intervention. You will also understand why Azure gives you so many options and how to pick the right one without overthinking it.

## Why Pipelines Matter (and Why They Are Intimidating)

A data pipeline is a sequence of operations that takes data from Point A and delivers it to Point B, often transformed along the way. In a traditional on-premises analytics environment, you would write a script, schedule it in a job scheduler, and hope it runs every night without errors.

In Azure, you build pipelines visually. You connect data sources to transformation steps to destinations. You schedule them. You monitor them. You get alerted if they fail. This sounds like progress until you realise that the visual designer has roughly 47 options on the menu and none of them are labelled clearly.

Here is the paradox: Azure Data Factory (the pipeline tool) is incredibly powerful. It can orchestrate workflows across hundreds of services. It can handle retries, error branches, and conditional logic. But for your first pipeline, you need exactly 3 operations: read data from a source, optionally transform it, write it to a destination.

The goal of this section is to help you build that simple pipeline without getting seduced into building something complex because the UI shows you the option.

## Azure Data Factory: The Pipeline Builder

Azure Data Factory (ADF) is Azure's orchestration engine. You use it to automate data movement and transformation. Think of it as a scheduler that can do more than just run SQL scripts.

When you create an ADF instance, you get a studio interface. Do not be intimidated by it. Ignore 90% of the options. Focus on three things: linked services, datasets, and pipelines.

**Linked services** are connections to external systems. You create a linked service to your SQL database, your blob storage, your on-premises database, or whatever source or destination you want to use. A linked service stores the connection details (server name, authentication method, credentials). Once created, you reuse it across multiple pipelines.

**Datasets** are references to data at a specific location. You might have a dataset called "raw_sales_data" that points to a CSV file in your blob container. Another dataset called "cleaned_sales" that points to a table in your SQL database. Datasets are metadata descriptions of where data lives and how it is formatted.

**Pipelines** are sequences of activities. An activity might be "copy data from this dataset to that dataset" or "run this stored procedure" or "send this email if something fails." Most of your work happens here. You drag activities onto a canvas, connect them with arrows, and configure each one.

Here is the thing: if you only need to move data from a blob container to a SQL database without transformation, you can do that with one activity: Copy Data. Drag it onto the canvas, point it at your source, point it at your destination, set the schedule, and done. You have a pipeline.

## Building Your First Pipeline: Raw Data to Database

Let us walk through a practical example. You have a CSV file in your blob storage. It contains product names, prices, and quantities. You want to load it into a SQL table every night.

**Step 1: Create a linked service to your blob storage.** Go to "Manage" (the wrench icon), select "Linked Services," and create a new one. Choose "Azure Blob Storage." Select your storage account. Add authentication (usually a managed identity if you set it up correctly in Part 1). Test the connection. If it fails, you forgot to grant your managed identity permission. Go back to Part 1 and fix it.

**Step 2: Create a linked service to your SQL database.** Same process. Choose "Azure SQL Database." Enter your server name, database name, and authentication method. Test the connection. Managed identity again, unless your organisation uses SQL authentication.

**Step 3: Create datasets.** Go to "Author" (the pencil icon). Create a new dataset for your CSV file. Choose "Blob Storage," "Delimited Text," and point it at your CSV file. Call it `products_csv`. Create another dataset for your SQL table. Choose "Azure SQL Database" and select the table you want to load. Call it `products_table`.

**Step 4: Create a pipeline.** New pipeline. Drag a "Copy Data" activity onto the canvas. Configure it: source is `products_csv`, destination is `products_table`. You can set options like "skip incompatible rows" if you do not want the pipeline to fail on bad data. Click OK.

**Step 5: Test it.** Click "Debug" to run the pipeline once. If it succeeds, you see how many rows were copied. If it fails, you get an error message. Most errors are either: (a) schema mismatch (the CSV has different columns than the SQL table), (b) permission issue (your managed identity does not have write access to the table), or (c) the file does not exist at the path you specified. Fix the issue and debug again.

**Step 6: Schedule it.** Go to "Trigger" and create a new trigger. Set it to "Tumbling Window" and choose your schedule (daily, hourly, weekly). Click "Publish All." Now the pipeline runs on schedule.

That is a working pipeline. You moved data from storage to a database with zero code, zero scripting, just pointing and clicking. If this is all you ever do with ADF, you have solved 80% of your pipeline problems.

## When You Need Transformation: Data Flows and When to Use Them

Sometimes moving data raw is not enough. Your CSV has dates in a weird format. Your column names have spaces and special characters. You want to filter out old records. You need to join data from two sources. That is where data flows come in.

A data flow is a visual, code-free way to transform data. You drag a source onto the canvas, then add transformation steps: Filter (keep only rows where price > 100), Derived Column (create a new column with a formula), Aggregate (sum up quantities by product), Join (combine data from two sources).

Here is the reality: data flows look amazing in demos. They are visually intuitive. Until you try to do something moderately complex, and then you realize you are rebuilding SQL with drag-and-drop, which is slower and harder to debug.

My recommendation: for simple transformations (a few filters, renaming columns, simple joins), use data flows. For anything more complex, use a stored procedure in your SQL database instead. You write the logic in SQL (which you already know), schedule the stored procedure to run after your data lands, and keep your pipelines focused on movement.

If you know Python, Azure Synapse lets you write transformations in Python notebooks instead. We will cover that next.

## Azure Synapse Analytics: The Integrated Analytics Platform

Azure Synapse is the "everything you need for analytics in one place" tool. It combines data integration (like Data Factory), data warehousing (like SQL), and notebook environments (like Jupyter) all in one workspace.

When you create a Synapse workspace, Azure provisions a data lake (blob storage configured for analytics), a SQL database, and a notebook environment. Everything is pre-connected and pre-configured. You do not have to fiddle with managed identities across services because they are all part of the same workspace.

Here is when you use Synapse instead of Data Factory: when you want to move data, transform it, and analyse it all in the same place without context switching. You land your CSV in blob storage. You write a SQL query to clean and aggregate it. You write a Python notebook to do statistical analysis. All in one tool, all with the same data context.

Here is when you use Data Factory instead of Synapse: when you have complex orchestration logic (if this then that, retry on failure, send alerts), or when you are integrating with legacy systems outside of Azure. Synapse is great at moving data within its ecosystem. Data Factory is great at orchestration across systems.

For most analysts, you will use both: Data Factory for the plumbing (moving data between systems), Synapse for the analysis (writing queries and notebooks once the data is clean).

## Building Your First Synapse Analysis

Let us say your data is already in a Synapse workspace. You want to write some queries and share notebooks with your team.

**Step 1: Create a SQL script.** Go to the "Develop" tab. New SQL script. Write a basic query:

```sql
SELECT
    product_name,
    COUNT(*) as order_count,
    SUM(quantity) as total_quantity
FROM products
GROUP BY product_name
ORDER BY order_count DESC;
```

Click "Run." You get results in seconds (or minutes if the dataset is large). Save the script. Call it "Product Orders Summary."

**Step 2: Create a notebook.** New notebook. This opens a Jupyter-like interface where you can write Python code, markdown text, and SQL queries all in the same place.

Add a markdown cell at the top:

```markdown
# Product Analysis

This notebook explores product sales patterns.
```

Add a Python cell:

```python
import pandas as pd

# Load the SQL query results
df = spark.sql("""
    SELECT product_name, order_count, total_quantity
    FROM products_summary
    ORDER BY order_count DESC
""").toPandas()

# Display the dataframe
display(df)
```

The `display()` function renders the dataframe as a table in the notebook. You can add charts, filters, and more complex analysis.

**Step 3: Share it.** Synapse lets you share notebooks and scripts with your team. Everyone with access to the workspace can see what you wrote, the results, and the underlying code. This is how data analysis becomes collaborative instead of siloed.

## The Data Movement Pattern That Actually Works

Here is the pattern that prevents chaos:

**Stage 1: Raw (Blob Storage).** Land your data here as is. CSV from a vendor. JSON logs from an API. Parquet files from another team. Do not transform it yet. Just drop it in blob storage with a clear folder structure: `/raw/sales/2026-03-15/sales_data.csv`.

**Stage 2: Cleansed (SQL Database).** Write a stored procedure that reads from Stage 1 and writes cleaned data to a table in your SQL database. Schema is fixed. Dates are parsed correctly. Nulls are handled. Column names are standardised.

**Stage 3: Analysis (SQL Database or Synapse).** Write queries and notebooks that read from the cleansed tables. Build your insights here. You never touch raw data directly in your analysis. You always reference cleaned tables.

This three-stage pattern prevents your analysis from breaking when someone sends you a CSV with a different date format or an extra column. The cleaned stage is your contract. As long as that contract holds, your analysis is stable.

## Why This Approach Prevents Disaster

Here is what happens if you skip the cleansed stage and analyse raw data directly:

Week 1: Your analysis works. You build a report.
Week 2: A new CSV arrives with an extra column. Your query breaks.
Week 3: Your colleague manually fixes the CSV before uploading it.
Week 4: Someone forgets to manually fix it. Your pipeline silently produces wrong results.
Week 6: Your report shows the wrong numbers to the business. Trust is destroyed.

If you had cleansed the data at Stage 2, the pipeline would have failed visibly (the stored procedure would error on the new column). You would have fixed it once, deployed the fix, and moved on.

The extra 30 minutes of work to build a cleansing layer saves you from 30 hours of debugging bad analysis later.

## Scheduling Pipelines Without Burning Down the Organisation

Once your pipeline works, you schedule it. Here are the things that go wrong:

**1. It runs at the wrong time.** You schedule a pipeline to run at 8 AM to feed a 9 AM meeting. But Data Factory's time is UTC and your organisation is in UK time. Pipeline runs at 9 AM UTC (10 AM UK time). Meeting has already happened. Everyone is confused.

Fix: be explicit about time zones. Document that your pipeline runs at 8 AM UTC on purpose. Adjust the time in your trigger to run at 7 AM UTC if you need it before 8 AM UK time.

**2. It fails silently.** Your pipeline fails at 3 AM. Nobody notices until 8 AM when someone realises the data is not updated. All the reports that depend on it are stale.

Fix: set up alerts. When a pipeline fails, send yourself an email immediately. In ADF, you can add an activity that sends an email if the previous activity fails. Or use Azure Monitor to alert on pipeline failures.

**3. It runs twice.** A pipeline scheduled for 8 AM somehow runs at 8 AM and again at 8:30 AM because you accidentally created two triggers. Your data is duplicated. Analytics are wrong.

Fix: before publishing a trigger, list all existing triggers for that pipeline. Make sure you are not creating a duplicate. Name your triggers clearly: `daily_sales_import_830am` is unambiguous.

## The Bottom Line

You now have the pattern: store raw data, cleanse it with pipelines or stored procedures, analyse the cleansed data. You can build pipelines visually without code, and you can write analysis notebooks in Synapse alongside SQL scripts.

This is how analytics in Azure actually works, not the marketing version:

1. **Start simple.** Use Data Factory's Copy Data activity for your first pipeline. Move raw data into a database. Do not build complex transforms until you know you need them.

2. **Cleanse once.** Build one cleansing layer (stored procedure, data flow, or Synapse notebook) that produces standardised output. Everything else reads from this layer.

3. **Schedule with intention.** Be explicit about times, add error alerts, and test a full pipeline run before leaving it unattended overnight.

You now have everything you need to build analytics infrastructure in Azure. In a future article, we will cover real-time analytics and why your next pipeline will probably need to run every hour instead of once a day, and what that costs.

---

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

P.S. If you find yourself writing the same cleansing logic in multiple pipelines, stop. Extract it into a shared stored procedure or a reusable Synapse notebook. The first time you do this is annoying. The second time you avoid duplication, you will appreciate it forever.
