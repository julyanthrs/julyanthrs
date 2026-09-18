export const contactCopy = {
  headlineLines: ["Let's build", "something", "memorable."],
  message: "Have a product, a launch or a strange idea? Tell me a little about it and I'll reply within two working days.",
  projectTypes: ["Website", "Web app", "UI/UX design", "Design system", "Something else"],
} as const;

export const contactLimits = {
  nameMax: 80,
  emailMax: 254,
  messageMin: 20,
  messageMax: 2000,
} as const;
