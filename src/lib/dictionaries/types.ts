export type Dictionary = {
  seo: {
    defaultTitle: string;
    defaultDescription: string;
  };
  nav: {
    home: string;
    pricing: string;
    about: string;
    support: string;
    faq: string;
    demo: string;
    demos: string;
    contact: string;
  };
  header: {
    whatsappCta: string;
  };
  footer: {
    tagline: string;
    explore: string;
    legal: string;
    rights: string;
    privacy: string;
    terms: string;
    cookies: string;
    kvkk: string;
    trustResponse: string;
    trustCustom: string;
    trustNoFees: string;
    companyHeading: string;
    taxIdLabel: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    heroTrustLine: string;
    socialProofTitle: string;
    socialProofSubtitle: string;
    socialProofTagline: string;
    servicesTitle: string;
    servicesSubtitle: string;
    services: {
      mobile: { title: string; body: string };
      dashboard: { title: string; body: string };
      automation: { title: string; body: string };
      growth: { title: string; body: string };
    };
    howTitle: string;
    howSubtitle: string;
    steps: { title: string; body: string }[];
    pricingTeaser: string;
    requestPricingCta: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaWhatsApp: string;
    pricingEstimatorTitle: string;
    pricingEstimatorSubtitle: string;
    pricingEstimatorPickLabel: string;
    pricingEstimatorResultTitle: string;
    pricingEstimatorDisclaimer: string;
    pricingEstimatorCta: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    scopeLine: string;
    whatsappCta: string;
  };
  about: {
    title: string;
    lead: string;
    p1: string;
    p2: string;
    p3: string;
  };
  support: {
    title: string;
    subtitle: string;
    emailLabel: string;
    whatsappLabel: string;
    phoneLabel: string;
    responseTitle: string;
    responseBody: string;
    postTitle: string;
    postBody: string;
  };
  faq: {
    title: string;
    subtitle: string;
    items: { q: string; a: string }[];
  };
  demos: {
    pageTitle: string;
    pageSubtitle: string;
    viewDemo: string;
    openInNewTab: string;
    backToList: string;
    notFoundTitle: string;
    notFoundBody: string;
    iframeHelp: string;
    emptyTitle: string;
    emptyBody: string;
    interactiveBadge: string;
    fullDemoHubHint: string;
    fullDemoHubLink: string;
  };
  legal: {
    lastUpdated: string;
    identityHeading: string;
    identityLines: string[];
    closingLines: string[];
    privacy: { title: string; blocks: string[] };
    terms: { title: string; blocks: string[] };
    cookies: { title: string; blocks: string[] };
    kvkk: { title: string; blocks: string[] };
  };
  form: {
    title: string;
    trustNote: string;
    name: string;
    email: string;
    service: string;
    message: string;
    submit: string;
    sending: string;
    success: string;
    error: string;
    serviceOptions: { value: string; label: string }[];
  };
};
