# Evaluation results

Generated 2026-10-03 06:58 UTC by `scripts/eval.py`.

Each question runs through the Maple Route graph (Knowledge Base, verifier) and through a naive baseline: the same model with no tools. The baseline answers from the model's own memory, so it has no citations and can repeat rules that have since changed.

## 1. I'm a software developer in Toronto with a full-time job offer. What work permit options do I have?

- Time: 19s · verifier revisions: 0 · claims: 10 supported · sources: 4 · Changed callouts: 0
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
You can apply for a work permit through the Global Talent Stream, Category B, which includes software developers. [1]

Your employer does not need a referral partner, but must list the job on the ESDC global talent occupations list. [2]

The employer can submit the LMIA application up to 6 months before you start working. [1]

The LMIA usually takes about 10 business days to process. [1]

Once the LMIA is approved, your work permit can be processed in about 10 business days with accelerated processing. [1]

The employer must pay a $1,000 processing fee for each position; the fee is not refunded if the application is withdrawn or denied. [3]

The work permit can be valid for up to 3 years for high‑wage positions, and longer if the employer provides a strong rationale. [1]

The LMIA letter is valid for 6 months from the issue date. [4]

The prevailing wage for the Global Talent Stream is the highest of the regional median hourly wage, the wage range paid to existing employees in the same job, and any applicable minimum floor. [2]

Only guaranteed wages count toward meeting the prevailing wage; overtime, tips, bonuses, profit sharing, commissions, and other compensation are excluded. [2]

Sources
[1] Program requirements for the Global Talent Stream - Canada.ca § Program requirements for the Global Talent Stream › List of designated referral partners for Category A Updated: September 15, 2026 › Atlantic Canada (September 15, 2026)
[2] Program requirements for the Global Talent Stream - Canada.ca § Program requirements for the Global Talent Stream
[3] Applicant guide for the Temporary Foreign Worker Program Global Talent Stream - Canada.ca § Applicant guide for the Global Talent Stream › Temporary foreign worker information template (PDF form)
[4] Hire a temporary foreign worker through the Global Talent Stream - Canada.ca § Hire a top foreign talent through the Global Talent Stream › How to apply › Submitting your application using LMIA Online

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
**Work‑permit options for a software developer with a full‑time job offer in Toronto**

| Permit type | Who can apply | Main requirements | Typical processing time* |
|-------------|---------------|-------------------|--------------------------|
| **Employer‑specific (LMIA‑based) work permit** | Any foreign worker with a job offer from a Canadian employer | • Employer must obtain a positive Labour Market Impact Assessment (LMIA) showing no Canadians/PRs available for the role  <br>• Offer must be full‑time, non‑seasonal, and at least the prevailing wage  <br>• You must meet the job’s skill‑level (usually NOC 0, A or B) and have the required education/experience | 2‑4 months (online) |
| **LMIA‑exempt work permits** (International Mobility Program) | Workers whose employment brings “significant benefit” to Canada or falls under a treaty/exception | • No LMIA needed, but a **job offer letter** and a **positive Labour Market Impact Assessment‑exempt offer** are required.  <br>• Common categories for tech workers:  <br> • **Intra‑Company Transfer** (if you’re moving within a multinational)  <br> • **CUSMA/USMCA** (U.S. or Mexican citizens)  <br> • **Global Talent Stream (GTS) – Category A** (high‑skill positions for firms that are designated or have a proven track record)  <br>• Must still meet NOC 0/A/B and education/experience criteria | 1‑2 weeks (GTS) or 2‑4 weeks (other IM‑exempt streams) |
| **Open work permit (spouse/common‑law partner)** | Your spouse or common‑law partner who is a **full‑time student**, **temporary foreign worker**, or **permanent resident applicant** | • You can work for any employer, no LMIA needed.  <br>• You must be the eligible spouse/partner of someone with a valid study or work permit, or a PR applicant with a pending **spousal sponsorship** | Same as the primary permit (usually 2‑4 months) |
| **Post‑Graduation Work Permit (PGWP)** | Recent graduates of a designated Canadian post‑secondary institution (≤ 3 years of study) | • Must have completed a program of at least 8 months.  <br>• Allows open work for up to the length of the study program (max 3 years). | 2‑3 months |

\*Processing times are averages from IRCC’s online tool (subject to change).

### What’s most common for a software developer?
1. **Global Talent Stream (GTS) – Category A**  
   *Fast (≈ 2 weeks) and designed for high‑skill tech roles.*  
   • Your employer must be a **designated GTS employer** or have a **track record of hiring internationally**.  
   • You’ll need a **Labour Market Benefits Plan** signed by the employer.

2. **Standard LMIA‑based work permit**  
   *If the employer isn’t in GTS, they’ll need to get an LMIA.*  

### Next steps
1. **Confirm the employer’s route** – ask if they’re using GTS or will apply for an LMIA.  
2. **Gather documents** – job offer letter, proof of qualifications (degree, transcripts, work experience letters), passport, and any LMIA or GTS paperwork the employer provides.  
3. **Submit the application** online through the IRCC portal (or via a Visa Application Centre if you’re outside Canada).  
4. **Wait for the work‑permit approval**, then travel to Canada (if you’re outside) or start working once the permit is issued (if you’re already in Canada on a visitor status).

If you later want to stay permanently, many tech workers transition from a GTS or LMIA work permit to **Express Entry** streams such as **Canadian Experience Class** or **Federal Skilled Worker**, but that’s a separate conversation.
```

## 2. I graduated from a Canadian college program two years ago. Can I still get a post-graduation work permit?

- Time: 10s · verifier revisions: 0 · claims: 2 supported · sources: 1 · Changed callouts: 0
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
You must apply for a post‑graduation work permit within 180 days after you receive confirmation that you have completed your program. [1]

Your study permit must have been valid at some point during those 180 days. [1]

Because you graduated two years ago, you missed the 180‑day window and cannot apply for a post‑graduation work permit now. [1]

Sources
[1] Post-graduation work permit: Who can apply - Canada.ca
    https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation/eligibility.html

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
A Post‑Graduation Work Permit (PGWP) can only be issued if you apply **within 180 days (about 6 months)** after you receive your official transcript or degree confirmation showing you completed an eligible program. Since it’s been two years, the window has closed and you can’t get a new PGWP for that study period.

You’ll need to explore other work‑permit options (e.g., a job‑offer‑based employer‑specific work permit, the Open Work Permit for spouses, or a Provincial Nominee Program) if you still want to work in Canada. If you later enroll in another eligible program, you could qualify for a new PGWP after that program’s completion.
```

## 3. Does my spouse get an open work permit if I come to Canada on a work permit?

- Time: 14s · verifier revisions: 0 · claims: 5 supported · sources: 1 · Changed callouts: 0
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
If you are a high‑skilled worker (TEER 0, 1, or select TEER 2/3) and you are not on a permanent‑residence pathway, your spouse can apply for an open work permit only if you have a valid work permit that will be valid for at least 16 months after your spouse’s application is received. [1]

If you are a high‑skilled worker and you have already applied for permanent residence under an eligible economic class program, your spouse may be eligible for an open work permit. [1]

If you are a low‑skilled worker (TEER 4 or 5) on a designated permanent‑residence pathway but have not yet applied for permanent residence, your spouse may be eligible for an open work permit. [1]

Spouses of RCIP or FCIP applicants may qualify for a separate open work permit under those pilots. [1]

Spouses of refugee claimants, subjects of an unenforceable removal order, international students in co‑op or working off‑campus without a permit, and holders of a spousal open work permit are not eligible as principal applicants for family member open work permit eligibility. [1]

The findings do not cover other types of work permits or specific program details beyond those listed.

Sources
[1] Open work permits for family members of foreign workers: Who can apply - Canada.ca
    https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/special-instructions/spouses-dependent-children/eligibility.html

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
Yes—if you get a **work permit that is open** (e.g., under the International Mobility Program) or a **closed work permit that is tied to a LMIA‑exempt employer** (such as a Global Talent Stream, Intra‑Company Transfer, or a post‑graduation work permit), your spouse can usually apply for an **open work permit** as your accompanying family member.

**When it applies**

| Your work‑permit type | Spouse’s eligibility for an open work permit |
|-----------------------|-----------------------------------------------|
| **LMIA‑exempt (International Mobility Program)** – e.g., Global Talent Stream, CUSMA, Intra‑Company Transfer, Significant Benefit, etc. | ✅ Eligible for an **open work permit** (spouse can work for any employer). |
| **Post‑graduation work permit (PGWP)** | ✅ Eligible for an **open work permit**. |
| **Open work permit** (e.g., Bridging Open Work Permit, Open Permit for vulnerable workers) | ✅ Spouse can also get an open work permit. |
| **Closed work permit that required an LMIA** (most employer‑specific permits) | ❌ Spouse **cannot** get an open work permit; they may only apply for a visitor visa or a study permit. |

**How to apply**

1. **Include your spouse in your initial application** (if you apply online through the Employer Specific Work Permit stream and you’re LMIA‑exempt).  
2. Or, **apply separately** after you receive your work permit: submit a **spouse open work permit application** (Form IMM 5710) along with proof of your valid work permit, marriage certificate, and any required fees.  
3. The processing time is usually the same as the main applicant’s work‑permit processing time, but you can check current estimates on the IRCC website.

**Key points to remember**

- The open work permit for spouses is **not automatic**; it must be applied for and approved.  
- The permit is **valid for the same duration** as your work permit (or until it expires, whichever is earlier).  
- If your work permit is **closed and LMIA‑based**, the spouse can only come as a visitor or study, not work.  

**Bottom line:**  
If your Canadian work permit is LMIA‑exempt (most tech‑focused streams), your spouse can obtain an open work permit and work for any employer. If your permit required an LMIA, the spouse cannot get an open work permit.
```

## 4. Which Ontario employers received positive LMIAs for software engineers recently?

- Time: 4s · verifier revisions: 0 · claims: none · sources: 0 · Changed callouts: 0
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
I don’t have that information.

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
I’m sorry, but I don’t have access to up‑to‑date lists of specific Ontario employers that have recently received positive Labour Market Impact Assessments (LMIA) for software‑engineer positions. Those details are typically published by the employer themselves or can sometimes be found in news releases, but they aren’t compiled in a publicly searchable database that I can query.  

If you’re looking for current LMIA opportunities, here are a few practical steps you can take:

1. **Job‑search sites** – Look for postings that explicitly mention “LMIA‑supported” or “employer‑specific work permit.”  
2. **Recruitment agencies** – Some agencies specialize in placing tech talent with employers who have active LMIAs.  
3. **Provincial tech hubs** – Companies in Toronto’s “Tech Corridor,” Waterloo, and Ottawa often sponsor foreign talent; checking their career pages can help.  
4. **Networking** – Join local tech groups on LinkedIn, Meetup, or industry forums; members often share when their companies are hiring with LMIA support.  
5. **Immigration consultants** – A licensed consultant can sometimes provide a list of employers they’re working with who have recent LMIA approvals.

If you find a specific job posting that mentions an LMIA, you can move forward with the employer‑specific work‑permit application. Otherwise, keep an eye on the sources above for the most current opportunities.
```

## 5. Do I get extra Express Entry points for a job offer?

- Time: 5s · verifier revisions: 0 · claims: 2 supported · sources: 1 · Changed callouts: 0
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
You do not get extra points for a job offer in the Comprehensive Ranking System. [1]

A job offer still matters for eligibility in some programs, but it does not add points to your CRS score. [1]

Sources
[1] Express Entry: Comprehensive Ranking System (CRS) criteria - Canada.ca
    https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
Yes. If you have a **valid, full‑time, permanent job offer** from a Canadian employer that meets the criteria for a **Labour Market Impact Assessment (LMIA)** or is exempt under an **LMIA‑exempt category** (e.g., intra‑company transfer, certain academic or research positions, or a job covered by a provincial nomination), you can claim **50 additional Comprehensive Ranking System (CRS) points** in Express Entry.

**Key points to remember**

| Requirement | What it means |
|-------------|----------------|
| **Full‑time & permanent** | The offer must be for at least 1 year of continuous work, not seasonal or temporary. |
| **LMIA‑positive or LMIA‑exempt** | Most employer‑driven offers need a positive LMIA. Some categories (e.g., NAFTA/USMCA, CUSMA, certain academic jobs, provincial‑nominee‑linked offers) are exempt. |
| **NOC 0, A, or B** | The job must be classified under National Occupational Classification (NOC) skill level 0, A, or B. |
| **Employer’s compliance** | The employer must be in good standing with Immigration, Refugees and Citizenship Canada (IRCC) and have a valid offer letter that includes wage, duties, location, and start date. |
| **Proof required** | You’ll need to upload the LMIA (or LMIA‑exempt confirmation) and the written job offer when you create your Express Entry profile. |

If any of those conditions aren’t met, the job offer **won’t give you the extra 50 points**. Otherwise, the boost can be enough to move you from the “draw” pool into a position that receives an Invitation to Apply (ITA) for permanent residence.
```

## 6. Can I get a work permit in Australia as a software engineer?

- Time: 1s · verifier revisions: 0 · claims: none · sources: 0 · Changed callouts: 0
- Steps: orchestrator → finalize

**Maple Route**

```text
I can't answer this from the sources I use. They cover Canadian work permits and permanent residence pathways for tech workers, mainly in Ontario.

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
I’m focused on Canadian work permits and permanent‑residence pathways for tech workers, so I can’t give detailed advice about Australian visas. For Australia, you’d want to look into the **Skilled Independent visa (subclass 189)**, the **Skilled Nominated visa (subclass 190)**, or the **Temporary Skill Shortage (TSS) visa (subclass 482)**, and check the Australian Department of Home Affairs website for the latest requirements. If you have questions about Canada, feel free to ask!
```

## 7. I read that a job offer gives me 50 or 200 extra points in Express Entry. Is that still true?

- Time: 11s · verifier revisions: 0 · claims: 2 supported, 1 unsupported · sources: 1 · Changed callouts: 1
- Steps: orchestrator → policy_agent → synthesizer → verifier → finalize

**Maple Route**

```text
Job offer points are no longer added to the Comprehensive Ranking System score for any Express Entry candidate. [1]

The 200-point bonus for Major Group 00 offers and the 50-point bonus for other skilled occupation offers have been removed. [1]

A job offer still matters for eligibility in some programs, such as the Federal Skilled Trades Program, the Federal Skilled Worker Program, and certain provincial nominee streams. [1]

⚠ Changed — Current rule says job offers no longer add CRS points.
  Before: A job offer grants 50 or 200 extra points in Express Entry.
          what you mentioned
  Now:    As of March 25, 2025, job offer points have been removed from the CRS for all current and future candidates — including the 200-point bonus for Major Group 00 (senior management) offers and the 50-point bonus for all other skilled occupation offers.
          https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html

Sources
[1] Express Entry: Comprehensive Ranking System (CRS) criteria - Canada.ca
    https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html

This is information from official sources, not legal advice. For your specific case, talk to a licensed immigration consultant (RCIC) or lawyer.

(verifier revisions: 0)
```

**Naive baseline (same model, no tools)**

```text
Yes—having a **valid job offer** can still add points in the Express Entry system, but the amount depends on the type of offer:

| Type of job offer | Points added (if you meet the criteria) |
|-------------------|------------------------------------------|
| **NOC 00 – 02** (senior‑managerial, professional, or skilled trade positions that are **continuous, full‑time, and for at least one year**) | **200 points** |
| **NOC 03 – 06** (other skilled positions that meet the same conditions) | **50 points** |
| **NOC 07 – 09** (intermediate‑skill jobs) | **No points** (they don’t count for Express Entry) |

**Key things to remember**

1. **Labour Market Impact Assessment (LMIA) or LMIA‑exempt offer** – The offer must be supported by a positive LMIA, or fall under an LMIA‑exempt category (e.g., intra‑company transfer, international agreements, certain post‑graduation work permits, etc.).
2. **Continuity & duration** – The job must be **continuous, full‑time (≥30 hrs/week)** and **for at least one year** from the start date.
3. **Employer compliance** – The employer must be a legitimate Canadian business, and the job must be classified correctly under the National Occupational Classification (NOC) system.
4. **Proof** – You’ll need a written job offer letter, the LMIA (or LMIA‑exempt document), and any supporting contracts when you submit your Express Entry profile.

If you meet those conditions, the extra points are automatically added to your Comprehensive Ranking System (CRS) score, which can make a big difference in getting an Invitation to Apply (ITA) for permanent residence.
```
