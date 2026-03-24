---
authors:
  - rv
categories:
  - Data Strategy
  - AI Tooling
comments: true
date: 2025-12-10
description: Build serverless data pipelines in AWS using S3, Glue, Athena, and QuickSight without managing infrastructure or provisioning servers.
draft: false
slug: aws-data-pipelines-s3-athena-glue-quicksight
tags:
  - AWS
  - data pipelines
  - cloud analytics
  - serverless
  - S3
  - Athena
  - Glue
  - QuickSight
---

# Building Production Data Pipelines in AWS: S3 to QuickSight in 4 Steps

**TL;DR:** Build serverless data pipelines in AWS using four core services: S3 for storage, Glue for ETL and cataloguing, Athena for SQL queries, and QuickSight for visualisation. This stack eliminates infrastructure management, scales automatically, and follows pay-per-query pricing. You can deploy a production pipeline in days, not months.

<!-- more -->

Most organisations spend months provisioning servers, configuring databases, and managing infrastructure before their data pipeline processes a single row. AWS lets you skip all of that: store data in S3, query it with Athena, transform it with Glue, visualise it in QuickSight, and you're done.

Here's how each service fits together and what gotchas to watch for.

## Why AWS for Data Pipelines?

AWS offers a serverless analytics stack where you pay only for what you use, scale automatically without capacity planning, and integrate with enterprise governance tools.

That's the promise. Here's what it actually means.

Traditional on-premise data infrastructure requires database servers, ETL tools, storage arrays, and someone to maintain all of it. You pay for capacity whether you use it or not. When demand spikes, you're either over-provisioned and wasting money or under-provisioned and throttling queries.

AWS flips this model. S3 stores your data. Athena queries it on demand. Glue transforms it when you need it. QuickSight visualises the results.

No servers to provision. No databases to tune. No capacity planning spreadsheets.

You pay per query, per gigabyte scanned, per ETL job run. When you're not using it, you're not paying for it. When demand doubles, the system scales automatically.

At BMW Financial Services, we used this exact stack to migrate legacy SAS pipelines to AWS. The migration that would have taken six months with traditional infrastructure took 10 weeks. The ongoing maintenance overhead dropped by 60-70% because there were no servers to patch, no databases to optimise, no storage to provision.

This matters in regulated industries. Banking, insurance, utilities. Environments where change control is measured, governance is non-negotiable, and you cannot afford downtime.

The serverless model works when you need production-grade pipelines without a DevOps team managing infrastructure.

## What Is S3 and Why Does It Matter?

S3 is object storage that holds structured, semi-structured, and unstructured data in a single location, with built-in versioning, lifecycle policies, and security controls.

Think of it as a file system in the cloud. You create buckets (containers) and upload files to them. Those files can be CSVs, JSON, Parquet, images, logs, anything.

But unlike a traditional file system, S3 gives you:

**Durability:** 11 nines of durability. Your data does not disappear.

**Scalability:** Store petabytes without thinking about capacity.

**Versioning:** Enable versioning on a bucket and S3 keeps every version of every file. Accidental delete? Roll it back.

**Lifecycle policies:** Automatically move old data to cheaper storage tiers or delete it after a retention period.

**Access control:** Bucket policies define who can read, write, or delete data. Integrate with IAM roles for fine-grained permissions.

Here's where people get tripped up: S3 is not a database. You cannot update a row in place. You cannot index fields for fast lookups. You write files to S3, and you read them back. That's it.

This simplicity is the point. S3 is your data lake foundation. Raw data lands here. Transformed data lives here. Archive data stays here.

Every other service in the pipeline reads from or writes to S3.

### Folder Structure Best Practices

S3 does not have folders. It has keys. A key is the full path to an object: `s3://my-bucket/raw-data/2026/03/sales.csv`.

But you can simulate folders by using slashes in the key. This matters for organisation and performance.

A typical structure:

```
s3://analytics-bucket/
  raw/
    sales/
      2026/
        03/
          sales_20260320.csv
    customer/
      2026/
        03/
          customer_20260320.csv
  processed/
    sales/
    customer/
  archive/
```

Why partition by date? Because Athena can skip entire folders when querying. If you query March 2026 sales, Athena only scans the `2026/03/` folder, not the entire bucket. This saves time and money.

### File Formats: CSV, Parquet, JSON

You can store any file format in S3. But not all formats perform equally when queried.

**CSV:** Human-readable. Easy to generate. Terrible for performance. Athena scans every byte of a CSV to find the columns you want.

**Parquet:** Columnar format. Athena only scans the columns you query. A query that costs £10 on CSV costs £1 on Parquet. Always use Parquet for analytics workloads.

**JSON:** Good for semi-structured data with nested fields. Less efficient than Parquet but more flexible.

When data lands in S3 as CSV, use Glue to convert it to Parquet before querying. You'll see the difference immediately.

## AWS Glue: Data Cataloguing and ETL

Glue discovers your data schema automatically through crawlers, builds a central metadata catalogue, and runs serverless ETL jobs to clean and transform data before analysis.

This is the service people underestimate. Glue is not sexy. It does not have a slick UI. But it solves two critical problems.

**Problem 1: Schema discovery.** You upload 50 CSV files to S3. Each has different columns, different formats, different structures. How does Athena know what's in them?

Glue crawlers scan your S3 buckets, infer the schema, and populate the Glue Data Catalogue with table definitions. Now Athena knows what columns exist, what types they are, and where the data lives.

You point a crawler at an S3 path, schedule it to run daily, and it keeps the catalogue up to date as new files arrive.

**Problem 2: Data transformation.** Raw data is messy. Column names have spaces. Dates are strings. Files are CSVs instead of Parquet.

Glue ETL jobs transform raw data into clean, queryable formats. You write the transformation logic in Python or Scala (using Spark under the hood), and Glue runs it serverless. No clusters to manage.

### Glue vs DataBrew: When to Use Each

Glue has two ETL options: Glue ETL (code-based) and DataBrew (visual).

**Glue ETL:** Write Python scripts using the Glue library. Full control. Complex transformations. Requires coding skills.

**DataBrew:** Point-and-click interface. Build transformations visually. Great for analysts who don't code. Limited to predefined transformations.

Use DataBrew for simple cleaning (remove nulls, rename columns, convert formats). Use Glue ETL for anything involving joins, aggregations, or custom logic.

### How the Glue Data Catalogue Powers Athena

The Glue Data Catalogue is metadata. It stores table definitions, column names, data types, and S3 locations. It does not store the data itself.

When you query in Athena, Athena reads the catalogue to understand the schema, then queries the data directly in S3.

This separation matters. You can delete a table from the catalogue and the S3 data remains untouched. You can recreate the table and point it at the same S3 location.

One catalogue. Multiple query engines. Athena, Redshift Spectrum, EMR all use the same Glue catalogue.

## Amazon Athena: SQL Queries Without a Database

Athena lets you query data stored in S3 using standard SQL, without loading it into a database. You pay per query, and results return in seconds.

The first time you query S3 data with SQL, it feels wrong. There's no database. No tables to load. You just write a query and Athena scans the files.

But that's exactly how it works. Athena uses Presto (a distributed SQL engine) to read S3 files on the fly, apply your query, and return results.

### How Athena Works: Schema-on-Read

Traditional databases use schema-on-write. You define the schema upfront, load data into tables, and query those tables.

Athena uses schema-on-read. You write data to S3 in any format. When you query, Athena reads the Glue catalogue to understand the schema, scans the S3 files, and applies the schema at query time.

This flexibility is powerful. You can query data the moment it lands in S3. No loading. No indexing. No waiting.

But there's a trade-off. Performance depends on file format, partitioning, and data organisation. A poorly structured S3 bucket will cost more and run slower than a well-designed one.

### Writing SQL Queries Against S3 Files

Once your Glue crawler populates the catalogue, you query tables like any SQL database:

```sql
SELECT
  customer_id,
  SUM(order_total) AS total_spent
FROM sales
WHERE order_date >= '2026-01-01'
GROUP BY customer_id
ORDER BY total_spent DESC
LIMIT 10;
```

Athena supports standard SQL: joins, subqueries, window functions, CTEs. If you know SQL, you know Athena.

The difference is cost. Athena charges per terabyte scanned. The query above might scan 50GB of data. At £5 per terabyte, that's 25 pence.

Run that query 1,000 times a day and you're spending £250 daily. This is where partitioning matters.

### Partitioning for Performance

Partitions are subfolders in S3 that Athena can skip.

If your sales data is organised like this:

```
s3://sales-data/
  year=2025/
  year=2026/
    month=01/
    month=02/
    month=03/
```

And you query only March 2026:

```sql
SELECT * FROM sales
WHERE year = 2026 AND month = 03;
```

Athena scans only the `year=2026/month=03/` folder. It skips 2025 and skips January and February. You scan less data. You pay less.

This is not optional at scale. Without partitioning, every query scans the entire dataset.

### Query Cost optimisation

Three ways to cut Athena costs:

1. **Use Parquet instead of CSV.** Columnar formats scan only the columns you need. A 10-column table where you query 2 columns scans 20% of the data, not 100%.

2. **Partition by date.** Most analytics queries filter by time. Partition by year, month, or day depending on query patterns.

3. **Compress files.** Gzip or Snappy compression reduces storage size and scan cost. Athena decompresses on the fly.

At BMW, converting CSV files to Parquet and adding date partitions cut our Athena costs by 70%. Same queries. 70% less spend.

## AWS QuickSight: Dashboards That Scale

QuickSight is AWS's business intelligence tool. It connects to Athena as a data source, builds dashboards with calculated fields and filters, and shares them with stakeholders.

You've seen this pattern before if you've used Power BI or Tableau. Connect to a data source. Drag fields onto a canvas. Build charts. Share dashboards.

QuickSight does the same. The difference is pricing and integration.

### Connecting QuickSight to Athena

QuickSight connects directly to Athena. No intermediate database. No CSV exports. You point QuickSight at an Athena table, and it queries S3 through Athena.

This matters for real-time dashboards. When new data lands in S3, run a Glue crawler to update the catalogue, and QuickSight reflects the new data immediately. No ETL jobs to reload a dashboard database.

You build the dashboard once. The data stays in S3. QuickSight queries it on demand.

### Pricing: Per-User vs Per-Session

QuickSight has two pricing models:

**Standard Edition:** £9 per user per month. Best for teams where everyone needs regular access.

**Enterprise Edition:** £18 per user per month, or £0.30 per reader session (capped at £5 per reader per month). Best for organisations with many occasional users.

If you have 5 analysts building dashboards and 100 executives viewing them once a week, pay for 5 authors and let the executives use reader sessions.

Compare this to Power BI, which charges per user regardless of usage. QuickSight's session-based pricing works better for large organisations with wide dashboard distribution.

### When QuickSight Fits vs Alternatives

QuickSight works when:

- You're already using AWS for analytics
- You need dashboards that scale to thousands of users
- You want pay-per-use pricing instead of fixed per-user costs

QuickSight does not work when:

- You need deep customisation or pixel-perfect report layouts (use Tableau)
- Your team already has Power BI skills and Microsoft 365 integration (stick with Power BI)
- You want advanced statistical visualisations (use open-source tools like Plotly or Streamlit)

We used QuickSight at BMW for operational dashboards shared with 200+ stakeholders. The per-session pricing saved us compared to buying 200 Power BI licences. But our analysts still used Power BI for ad-hoc analysis because they preferred the interface.

Use the right tool for the job. QuickSight is one option, not the only option.

## Putting It All Together: A Real Pipeline

Here's what a production pipeline looks like end to end.

**Step 1: Raw data lands in S3.** A batch process uploads daily sales CSVs to `s3://analytics/raw/sales/2026/03/`.

**Step 2: Glue crawler discovers the schema.** A scheduled crawler runs nightly, scans the new files, updates the Glue Data Catalogue with table definitions.

**Step 3: Glue ETL job transforms the data.** A Glue job reads the raw CSVs, cleans column names, converts date strings to timestamps, writes Parquet files to `s3://analytics/processed/sales/`.

**Step 4: Athena queries the processed data.** Analysts write SQL queries against the `processed_sales` table. Queries return in seconds, scanning only the partitions they need.

**Step 5: QuickSight visualises the results.** A dashboard connects to the Athena table. Stakeholders see updated sales metrics every morning.

The data flows through four services. No servers. No manual intervention. No infrastructure to manage.

When I led the cloud migration at BMW Financial Services, this was the exact architecture we used to replace legacy SAS ETL pipelines. The legacy system required dedicated servers, scheduled batch jobs that ran overnight, and a team to monitor failures.

The AWS stack ran the same transformations in 60-70% less time. Glue jobs parallelised automatically. Athena queries that took 10 minutes in the old system returned in 30 seconds. And when something failed, CloudWatch logs told us exactly where and why.

The business impact: faster reporting cycles, lower infrastructure costs, and a data platform that scaled as the organisation grew.

## What This Stack Gets Right and What It Doesn't

This architecture works. I've built it in production. But it's not perfect for every use case.

**What it gets right:**

**No infrastructure management:** You write transformation logic and SQL queries. AWS handles the rest.

**Automatic scaling:** Data volumes triple? Glue and Athena scale automatically. You don't provision more capacity.

**Pay-per-use pricing:** You pay for queries, transformations, and storage. When you're not using it, you're not paying for compute.

**Fast time to value:** You can deploy a working pipeline in days. No months-long infrastructure buildouts.

**What it doesn't do well:**

**Real-time streaming:** This stack is batch-oriented. Data lands in S3, processes on a schedule, queries on demand. If you need sub-second latency, use Kinesis and DynamoDB instead.

**Complex joins on huge datasets:** Athena works well for queries that scan gigabytes or low terabytes. When you're joining petabyte-scale tables with complex logic, Redshift or EMR performs better.

**Custom transformation logic without coding:** DataBrew handles basic transformations visually, but anything complex requires Python or Scala in Glue ETL. If your team doesn't code, you'll need an alternative.

**Advanced BI features:** QuickSight is functional but not as polished as Tableau or Power BI. If your organisation already has Power BI skills and licences, connecting Power BI to Athena might make more sense.

Know the trade-offs. This stack excels at batch analytics on structured and semi-structured data. It struggles with real-time use cases and extremely complex transformations.

If you've worked with Azure, this is AWS's equivalent to the Azure Data Lake Gen2, Azure Data Factory, Azure Synapse, and Power BI stack. Different names, same architectural pattern. For a detailed comparison, see [how the Azure pipeline stack works](../2025-05-azure-for-data-analysts-part-2-pipelines-analytics/azure-for-data-analysts-part-2-pipelines-analytics.md).

## The Bottom Line

AWS gives you a serverless analytics stack that eliminates infrastructure overhead. Use it when you need production-ready pipelines without a DevOps team, when costs need to scale with usage, and when governance and security are non-negotiable.

Here's where to start:

1. **Set up an S3 bucket with sample data.** Upload a CSV file to `s3://your-bucket/raw/sample.csv`. Organise it by date: `s3://your-bucket/raw/2026/03/sample.csv`.

2. **Run a Glue crawler.** Point it at your S3 bucket. Let it discover the schema. Check the Glue Data Catalogue to see the table it created.

3. **Query with Athena.** Write a simple SQL query: `SELECT * FROM your_table LIMIT 10;`. See results in seconds. Check the data scanned and calculate the cost.

4. **Connect QuickSight.** Point it at your Athena table. Build a basic chart. Share it with a colleague.

Do this once, and you'll understand the architecture better than reading 10 tutorials.

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

---

P.S. The hardest part isn't the AWS services. It's designing the data model: what to partition by, which transformations to run where, how to structure files for performance. That comes from building pipelines, seeing what works, and adjusting. Start small. Iterate. The platform scales when you're ready.
