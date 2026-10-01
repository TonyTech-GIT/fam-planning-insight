/** Editorial content — single source of truth for FAQ, articles and disclaimers. */

export const DISCLAIMER_SHORT =
  'This platform provides estimates for planning and educational purposes. Results are not guarantees, financial advice, or predictions of actual future expenses.';

export const DISCLAIMER_LONG = [
  'Every figure on this site is an estimate produced by a transparent model from assumptions you selected. Economic conditions, individual circumstances, inflation, location and personal choices can materially change actual costs.',
  'This is not a marriage eligibility test, a wealth ranking, or a prediction of marital success. It estimates the financial requirements of a household under a specific set of assumptions, and nothing more. Many financially constrained households raise children well; many well-funded households struggle. Money is one input among many.',
  'We do not ask for, store, or want your BVN, NIN, bank credentials, card numbers or passwords. You can use the entire calculator without creating an account.',
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell us your plans',
    body: 'Location, household structure, children, education choices, housing, lifestyle, healthcare and transport. About 2–5 minutes, and you can stop at any point.',
  },
  {
    step: '02',
    title: 'We model the household',
    body: 'A versioned calculation engine applies location cost multipliers, household scaling, lifestyle tiers and published cost bands to your inputs.',
  },
  {
    step: '03',
    title: 'We project it forward',
    body: 'Costs are compounded using three bounded inflation scenarios, with categories weighted separately — food does not inflate like airtime.',
  },
  {
    step: '04',
    title: 'You interrogate the result',
    body: 'Every number opens up. Change one assumption at a time in the simulator, compare scenarios side by side, and see exactly what drives the total.',
  },
];

export const WHAT_WE_CALCULATE = [
  { title: 'Initial readiness target', body: 'Wedding, move-in costs, household setup, maternity reserve and emergency fund — the one-time money.' },
  { title: 'Monthly household requirement', body: 'Housing, food, education, healthcare, transport, utilities, communication and personal spending.' },
  { title: 'Emergency reserve', body: 'A configurable 1–24 months of essential expenses, defaulting to six.' },
  { title: 'Income gap', body: 'What your household earns against what the plan requires, plus the savings rate that follows from it.' },
  { title: 'Long-term family cost', body: 'An 18-year timeline including school entry, university and inflation compounding.' },
  { title: 'Readiness score', body: 'Eight weighted dimensions, each one fully shown, never hidden behind a black box.' },
];

export const FAQ = [
  {
    q: 'Is this telling me whether I can afford to get married?',
    a: 'No. It estimates what a household matching your stated plans would cost under your selected assumptions, and compares that with the income and savings you entered. Whether to marry is not a financial calculation, and this tool deliberately does not score you as a person.',
  },
  {
    q: 'Where do the numbers come from?',
    a: 'Inflation history comes from the NBS Consumer Price Index. Consumption structure draws on NBS household survey work. Most granular prices — rent by neighbourhood, school fees, HMO premiums — are not published in any single reliable national dataset, so those are clearly labelled estimates that you can and should override with your own figures.',
  },
  {
    q: 'Why do you show ranges instead of one exact number?',
    a: 'Because a single figure like ₦814,372 would be false precision. The band is asymmetric (−12% / +18%) because household costs surprise upward more often than downward.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. The calculator runs entirely in your browser. Saving a scenario is optional and stores only the anonymous inputs and results — no name, no email, no identifiers.',
  },
  {
    q: 'Why does the model support more than one spouse?',
    a: 'Because polygynous households exist in Nigeria and deserve accurate planning tools rather than being ignored. It is treated purely as a household modelling parameter, with no moral commentary attached.',
  },
  {
    q: 'What inflation rate do you assume?',
    a: 'Three bounded scenarios — roughly 11%, 17% and 26% — anchored on the last decade of reported NBS headline inflation. You can also enter your own rate. We never claim to know the future rate.',
  },
  {
    q: 'Does the AI assistant make up statistics?',
    a: 'It cannot. The assistant only receives figures already computed by the engine, and is instructed to refuse anything outside that payload. It explains your result; it does not source data.',
  },
  {
    q: 'Can this be used outside Nigeria?',
    a: 'The engine is country-agnostic; only the data layer is Nigerian today. Other countries appear in the country list but are marked unavailable until a credible dataset exists for them.',
  },
];

export interface Article {
  id: string;
  title: string;
  readMinutes: number;
  summary: string;
  body: string[];
}

export const ARTICLES: Article[] = [
  {
    id: 'purchasing-power',
    title: "Why ₦10 million today isn't ₦10 million tomorrow",
    readMinutes: 4,
    summary: 'Compounding works against savers as reliably as it works for investors.',
    body: [
      'Reported annual headline inflation in Nigeria averaged roughly 17% across the last decade, with 2023 and 2024 running far above that. At a sustained 17%, money loses about half its purchasing power in slightly over four years.',
      'That is why this platform never shows you a savings target without also showing what that target is worth in later years. A ₦10m preparation fund set aside and left idle in a current account is not a ₦10m fund by the time the second child starts school.',
      'The practical implication is not "spend it now". It is that a plan needs to specify not just how much you save, but what that money is held in, and how quickly the goal it is meant to fund is inflating.',
    ],
  },
  {
    id: 'children-inflation',
    title: 'How inflation reshapes the cost of raising children',
    readMinutes: 5,
    summary: 'The expensive years arrive exactly when compounding has done the most damage.',
    body: [
      'Child costs are not evenly distributed. The first five years are dominated by healthcare and childcare. Years six to seventeen are dominated by school fees. The university years are the single largest concentrated expense in most family plans.',
      'The problem is arithmetic: those university years fall 15 to 20 years after the plan is made, so they are hit hardest by compounding. A course of study that costs ₦3m a year today is projected at roughly ₦11m a year in 15 years under a 17% assumption.',
      'This is the strongest argument for starting an education fund early and holding it in something that at least attempts to track inflation, rather than assuming future salary will simply absorb it.',
    ],
  },
  {
    id: 'public-vs-private',
    title: 'Public versus private education: the number that actually matters',
    readMinutes: 4,
    summary: 'Tuition is often the smallest line in a tertiary education budget.',
    body: [
      'For a Nigerian public university, tuition is frequently the smallest component of the annual cost. Accommodation, feeding, transport, materials and a laptop routinely add up to several times the fee itself.',
      'That matters when comparing options, because a comparison of tuition alone can overstate the gap between public and private by a wide margin, while understating the total burden of the public route.',
      'In the calculator, every education option is broken into tuition, accommodation, transport, materials, technology, feeding and miscellaneous, so you compare complete costs rather than headline fees.',
    ],
  },
  {
    id: 'emergency-fund',
    title: 'How much emergency savings should a family actually hold?',
    readMinutes: 3,
    summary: 'Three months is a floor, not a target, when income is irregular.',
    body: [
      'The standard guidance of three to six months of essential expenses was written for economies with stable prices and predictable employment. Where income is irregular and medical costs are paid out of pocket, the upper end of that range is the sensible default.',
      'Note the word essential. The reserve is sized against rent, food, school fees, transport, healthcare and utilities — not against entertainment or travel, which you would cut first in a shock.',
      'The calculator defaults to six months and lets you set anything from one to twenty-four, showing the effect on your readiness score immediately.',
    ],
  },
  {
    id: 'wedding-vs-household',
    title: 'Affording a wedding is not the same as affording a household',
    readMinutes: 3,
    summary: 'One is a single day of spending. The other is two decades of cash flow.',
    body: [
      'A wedding is a one-time cost that can be scaled from under a million naira to tens of millions with no effect whatsoever on the household that follows it. A household is a recurring monthly obligation that compounds for twenty years.',
      'This platform separates the two deliberately, and shows them in different sections, because conflating them is one of the most common planning errors.',
      'If the one-time budget and the monthly requirement compete for the same money, the monthly requirement is the one that determines whether the plan holds.',
    ],
  },
  {
    id: 'lifestyle-inflation',
    title: 'Income versus lifestyle inflation',
    readMinutes: 3,
    summary: 'A raise only improves your position if the baseline does not move with it.',
    body: [
      'The model assumes nominal income growth of 10% a year by default — deliberately below the baseline inflation assumption, because salary growth in Nigeria has frequently lagged headline CPI.',
      'If you raise that assumption, the plan will look easier. That is worth doing only if you have a concrete reason to expect it, such as a contracted progression or a business with demonstrated growth.',
      'The more controllable variable is usually the lifestyle tier, which moves the whole recurring baseline by design: essential is 0.72× the modest baseline, high-comfort is 2.2×.',
    ],
  },
];
