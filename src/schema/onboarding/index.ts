import * as Yup from "yup";

/**
 * The escalation ticket, validated against what the support desk actually
 * accepts: a title capped at 220 characters, a description, and a category and
 * priority drawn from the desk's own closed vocabularies.
 */
export const escalationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .max(220, "Keep the title under 220 characters")
    .required("A title is required"),
  description: Yup.string()
    .trim()
    .required("A description is required - a sentence is enough"),
  category: Yup.string()
    .oneOf(["BUG", "SUPPORT", "HELP", "ACCOUNT", "BILLING", "OTHER"])
    .required("Pick a category"),
  priority: Yup.string()
    .oneOf(["LOW", "MEDIUM", "HIGH", "URGENT"])
    .required("Pick a priority"),
});

/**
 * The school profile form.
 *
 * The three required selects are the ones the go-live gate checks; the rest are
 * optional and validated only for shape. Nothing here re-states the choice
 * vocabularies - those ship with the record from the server, so a value this
 * form offers is a value the server accepts.
 */
export const schoolProfileSchema = Yup.object({
  ownership_type: Yup.string().required("Ownership type is required"),
  term_structure: Yup.string().required("Term structure is required"),
  currency: Yup.string().required("Currency is required"),
  address: Yup.string().trim().max(255, "Keep the address under 255 characters"),
  website: Yup.string()
    .trim()
    .url("Enter a full web address, starting with https://")
    .max(200, "Keep the website under 200 characters"),
  motto: Yup.string().trim().max(255, "Keep the motto under 255 characters"),
  registration_id: Yup.string()
    .trim()
    .max(64, "Keep the registration number under 64 characters"),
});
