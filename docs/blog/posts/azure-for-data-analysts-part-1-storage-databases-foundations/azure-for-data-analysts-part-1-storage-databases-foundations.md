---
authors:
  - rv
categories:
  - Data Strategy
  - AI Tooling
comments: true
date: 2025-05-09
description: How to set up Azure storage, SQL databases, and data foundations for enterprise analytics without vendor lock-in or unnecessary complexity.
draft: false
slug: azure-for-data-analysts-part-1-storage-databases-foundations
tags:
  - Azure
  - data storage
  - SQL databases
  - cloud analytics
  - data foundations
  - enterprise data
---

# Microsoft Azure for Data Analysts Part 1: Getting Started with Storage, Databases, and Data Foundations

**TL;DR:** Azure offers data analysts three essential building blocks: blob storage for flexible data housing, SQL databases for structured query work, and managed identity systems that eliminate credential nightmares. Most teams get this backwards, starting with tools instead of foundations. This article walks you through setting up storage accounts, SQL databases, and authentication properly so you do not waste months debugging access issues or redesigning data architecture later.

<!-- more -->

You are about to spend months in Azure. The foundation you build in the first week determines whether those months go smoothly or whether you spend them fighting permission errors, redesigning storage strategies, and explaining to your IT team why your managed identity has more roles than a C-suite executive.

This is Part 1 of a two-part series on Azure for data analysts. We will cover the infrastructure layer: storage accounts, SQL databases, and the authentication patterns that actually work in regulated enterprises. If you are an analyst joining an organisation with Azure already running, this clarifies the building blocks you will encounter. If you are setting up Azure from scratch, this prevents expensive missteps.

## Why Azure Matters for Data Analysts

Azure is not glamorous. It does not have the startup narrative of Snowflake. It lacks the vendor marketing dominance of AWS. But here is the thing: if you work in banking, insurance, utilities, manufacturing, or government, your organisation probably runs on Azure. Microsoft has embedded itself into enterprise IT. If you are building analytics capability there, you need to speak Azure fluently.

Most analysts approach Azure as a dashboard-deployment problem. You get handed credentials, connect PowerBI, and build reports. That works for 30 days. Then you hit the access wall, the data quality problem, or the governance requirement nobody mentioned, and suddenly you are stuck because the infrastructure underneath was built for a different era.

Building an analytics foundation in Azure means understanding three things: where your data lives, how you query it reliably, and how permissions actually work so you do not beg IT every time you need access to something new.

## The Azure Data Analyst's Three Building Blocks

Think of Azure analytics infrastructure as three layers. The bottom layer is storage. The middle layer is database query engines. The top layer is everything else (pipelines, notebooks, reporting tools). Most analysts jump straight to the top. Stop. Get the bottom right first.

**Layer 1: Storage (Blob Storage and Data Lakes).** This is where your raw data lives. A blob container is just a scalable file system in the cloud. You can throw anything in it: CSV files, Parquet datasets, JSON logs, images, PDFs, executables. Azure will store 500 terabytes of it without caring. The trade-off is pricing. Hot storage costs more because your data is immediately accessible. Cool, cold, and archive tiers cost less but add latency when you retrieve the data.

**Layer 2: Databases (SQL Managed Instance and SQL Database).** This is your structured data system. Azure SQL Database is Microsoft's cloud-native relational database. You connect it to Azure Data Studio (the analytics IDE), write T-SQL, and query data exactly as you would on an on-premise SQL Server. It handles backups, redundancy, and scaling automatically. You do not manage servers.

**Layer 3: Everything Else.** Pipelines (Azure Data Factory), notebooks (Azure Synapse), and transformation tools sit on top of Layers 1 and 2. Build your foundation first. Tools follow.

## What Storage Accounts Actually Do

A storage account is your entry point into Azure storage. Think of it as a container that houses blobs, tables, queues, and file shares. For analytics work, you care about blob containers.

When you create a storage account, Azure asks you three questions that matter:

**1. Which region?** Azure copies your data across physical locations for redundancy. If you are in London and your customers are in London, put the storage account in UK South. If you are serving global customers, you need geo-redundancy, which means Azure maintains replicas in distant regions. This costs more but guarantees availability. For initial setup, choose your local region. You can design for global distribution later.

**2. What redundancy do you need?** Locally redundant storage (LRS) replicates data within a single data centre. Geo-redundant storage (GRS) replicates across continents. Zone-redundant storage (ZRS) uses multiple availability zones. If your analysis data is a one-time project file, LRS is fine. If the data feeds a critical business process and losing it would hurt your organisation, use GRS. Everything between those extremes is context. Most teams choose GRS and never regret it.

**3. Hot or cool access?** This is the biggest cost lever. Hot storage costs more per gigabyte but retrieves data instantly (milliseconds). Cool storage costs 50% less but adds latency. If you are accessing data regularly for active analytics projects, use hot. If you are archiving historical datasets that you touch once a quarter, use cool or cold. Azure will let you move data between tiers later if your assumptions change.

Here is the practical reality: when you create your first storage account, set it to hot, locally redundant, and your home region. Call it something descriptive like `analyststorage2026` (must be lowercase and globally unique across all Azure). You will iterate from there.

Once your storage account exists, you create blob containers inside it. A blob container is like a folder. You might have containers named `raw-data`, `processed-data`, `reports`, `archives`. Each container has its own access permissions. You can lock down one container to a specific team and leave another open.

## SQL Databases: Where You Actually Do Analysis

A SQL database is where your structured data lives. Think of it as a cloud version of SQL Server, because that is what it is.

Setting up a SQL database requires four decisions:

**1. Create a server first.** A server is the host that runs your database. You give it a name, a region, and authentication method. Azure recommends Microsoft Entra authentication (single sign-on), but you can also use SQL Server authentication (username and password). Entra is cleaner because if you are already signed into Azure, you have access without entering credentials again. SQL authentication is simpler if you are building automated connections.

**2. Name the database.** Call it something specific to your project. `financial_analysis_db` or `customer_360_db` works. Generic names like `database1` create confusion later.

**3. Choose your compute tier.** Serverless is the default for new databases and the right choice for analytics. You pay only for what you use. If you query data for 2 hours a day, you pay for 2 hours. Provisioned tier locks you into a fixed compute cost whether you use it or not. Serverless wins for analytics work.

**4. Set up backups.** Azure handles this automatically. Backups are retained for 7 days on free tier, 35 days on standard. You do not need to think about it unless you are in a regulated industry with specific retention requirements. Even then, Azure will handle it if you request a custom policy.

One crucial step: after you create a server, configure public network access. By default, your database is locked down. If you want to query it from Azure Data Studio on your laptop, you need to tell Azure that your IP address is allowed. Azure will add your current IP automatically if you click the right button. This is not a security risk; you are just saying "my laptop can connect to this database from my home internet."

Once you have a database, you need users. If you are solo, you are the user. If your team is accessing the same database, you create SQL logins or Entra identities for each person. This is where things get trickier. Azure uses role-based access control (RBAC). You can assign roles like `db_reader` (read-only), `db_datareader` (access to data within tables), or `db_owner` (full control). Do not give everyone `db_owner`. Give analysts `db_reader` or `db_datareader`. Give data engineers `db_ddladmin` if they are building schema. Principle of least privilege sounds bureaucratic but prevents accidents.

## The Managed Identity Trap (and How to Avoid It)

Here is where most teams get stuck: authentication between Azure services.

Let's say you want to build a pipeline in Azure Data Factory that reads data from a SQL database and writes results to blob storage. You need permissions for all three services to talk to each other. Traditionally, you would create usernames and passwords and embed them in connection strings. That is a nightmare. When you rotate the password, every pipeline breaks. When someone leaves the team, you have 47 places to update credentials.

Azure's answer is managed identity. A managed identity is an automatically maintained credential that Azure handles for you. When you create a Data Factory instance, it gets a managed identity automatically. You then tell your SQL database, "give this managed identity permission to read from tables." Azure handles the credential refresh behind the scenes. No passwords to manage. No rotation failures.

Here is the common mistake: teams create the managed identity but forget to give it permission in the database. The connection appears to work locally, but when the pipeline runs, it fails with "permission denied." You then spend three days debugging because you assumed the managed identity would have permission by default. It does not.

The fix: after creating a service with a managed identity, you must explicitly add it as a user in your SQL database and assign it appropriate roles. In Azure Data Studio, you run a SQL command that looks like this:

```sql
CREATE USER [managed_identity_name] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [managed_identity_name];
```

That is it. Now the managed identity can read data from your database. If you want it to write results to a table, add `db_datawriter` role too. The point: managed identity is simpler than passwords, but you still have to set it up deliberately.

## Access Control: The Thing Nobody Explains Until It Is Too Late

Here is the pattern every analyst experiences in an enterprise Azure environment:

You arrive on day one. IT gives you access to PowerBI and a data warehouse database. You can see 47 tables. You start building reports. On day five, you want to access a blob storage container because someone suggested it has raw data. You try to connect. Access denied. You ask IT. They say, "You need to request access through the governance portal." You request it. Three days later, your request is approved. You finally see the data. By then, your momentum is gone.

This is not a bug. It is a feature. Azure has explicit permission boundaries for every single resource. A storage account is a separate permission from a SQL database, which is separate from a Data Factory pipeline. You cannot assume permissions flow down from the subscription level. They do not.

Here is how to think about it: each Azure resource is its own permission fortress. To access a blob container, you need either the storage account access key (like a master password) or a role assignment (like a key card). Access keys are simple but risky. Sharing a key between five people is how data gets exposed. Role assignments are better. You go into the storage account, click "Access Control (IAM)," and assign a role like "Storage Blob Data Reader" to specific people or service identities.

In a regulated organisation, expect to request access frequently. It is tedious but it is also protection. Someone cannot accidentally delete your entire analytics database because access is revoked by default.

The practical path: on day one, ask IT for the minimum access you need to start. Get `db_reader` on the analytics database. Get `Storage Blob Data Reader` on the raw data container. Get `contributor` on a sandbox Data Factory instance where you can experiment. Do not ask for full admin access because you will not get it and the request will look suspicious.

## Why Cloud Regions and Redundancy Matter (More Than You Think)

Azure operates in 60 regions globally. For most teams, picking a region is simple: choose the one closest to your users or headquarters. But redundancy is where data analysts often get schooled.

Imagine you work for a financial services firm. Your production analytics database is in UK South. A data centre goes down. Your database is inaccessible for 4 hours. Your CFO cannot get the daily cash position report. The trading desk cannot price risk. That one failure costs the firm millions. Now imagine you had set up geo-redundant storage and database replicas in another region. Failover happens automatically. Downtime is seconds, not hours.

For a startup analytics project? Locally redundant storage in a single region is fine. You are experimenting. Data loss would be frustrating, not catastrophic. For anything touching customer data, financial records, or compliance requirements? Use geo-redundancy. The cost is 20% more for storage, maybe 50% more for databases. The insurance it provides is worth it.

## Putting It Together: Your First Azure Setup

Here is the minimal setup that prevents most headaches:

1. **Create a resource group.** Call it `analytics-sandbox-2026`. Everything else lives inside this.

2. **Create a storage account in your region.** Call it `your-company-storage2026`. Set redundancy to geo-redundant. Set performance to standard (not premium, which is expensive and unnecessary for analytics). Create three blob containers: `raw`, `processed`, `archives`.

3. **Create a SQL server.** Call it `your-company-server.database.windows.net`. Use Entra authentication. In a secured enterprise, your IT team will create this. Do not create it yourself unless you own the infrastructure.

4. **Create a SQL database.** Call it `analytics_main`. Set it to serverless. Accept the default backup settings.

5. **Grant yourself access.** In the database, create a user from your Entra identity. Assign yourself `db_datareader` role.

6. **Test connectivity.** Download Azure Data Studio. Connect to your SQL server using your Entra credentials. Run `SELECT 1` to confirm it works. Write a simple query like `SELECT COUNT(*) FROM sys.tables` to see your database structure.

7. **Upload test data.** Create a small CSV file. Upload it to your `raw` container using the Azure portal or Azure Storage Explorer.

8. **Document what you built.** Write down the server name, database name, container names, and the roles you have. This will save you 47 questions later when you are onboarding a teammate.

That foundation takes 30 minutes. It prevents months of confusion.

## The Bottom Line

Azure's storage and database layer is not sexy. There are no conference talks about blob containers or SQL databases. But they are the foundation every analytics project depends on. Get them right and everything built on top works. Get them wrong and you spend months fighting access issues, redesigning data architecture, and debugging why a pipeline connects locally but fails in production.

Three things to take away:

1. **Storage and databases are separate permission domains.** Access to one does not grant access to another. Plan your permission model early.

2. **Managed identity eliminates credential management.** Use it for service-to-service connections. It saves you from password rotation nightmares.

3. **Start simple, scale complexity later.** Your first storage account can be locally redundant in your home region. Your first database can be serverless. You will iterate toward geo-redundancy and provisioned compute if and when you need it.

In Part 2, we will cover data pipelines (Azure Data Factory) and how to move data from storage into your databases, and from your databases into reporting tools. You will see how these foundations enable everything else.

---

[Connect with me on LinkedIn](https://www.linkedin.com/in/ryan-vijay){ .md-button }

P.S. If you are setting up Azure from scratch, resist the urge to build the perfect architecture immediately. Everyone does this. They create 47 resource groups, design elaborate networking, and implement governance frameworks before they have written a single analytics query. Build the minimal thing. Iterate. You will make better decisions once you have shipped something.
