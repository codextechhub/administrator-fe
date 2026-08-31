// ─────────────────────────────────────────────────────────────────────────────
// Shapes returned by /v1/students/ and /v1/guardians/.
//
// Three rules from the backend's own serializers run through all of them, and
// the types say so rather than leaving a reader to discover them:
//
//   1. The branch dimension RECEDES at a single-branch school. `branch` and
//      `branch_name` are dropped from the payload entirely - not nulled - so
//      both are optional here. A screen must read "absent" as "this school has
//      one branch", never as "no branch set". Verified against the seeded
//      sunrise-academy, which returns neither key.
//
//   2. Enums come back as CODES with a `*_label` beside them. Render the label;
//      compare on the code. Never build a label from the code in a screen, or
//      two screens will spell the same status differently.
//
//   3. There is no per-session anything here except the class placement. A
//      student's status, branch, guardians and documents are all current-state,
//      so nothing in this file is scoped to a year. See section 2.0 of
//      docs/students-design-phases.md for why that settles the session pill.
// ─────────────────────────────────────────────────────────────────────────────

/** Present on every row at a multi-branch school; absent entirely otherwise. */
export interface StudentScoped {
  branch?: number;
  branch_name?: string;
}

export type StudentStatus =
  | "APPLICANT"
  | "ENROLLED"
  | "ACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "TRANSFERRED"
  | "WITHDRAWN"
  | "REJECTED";

export type Gender = "FEMALE" | "MALE";

/** The directory row. No medical field and no guardian contact detail is in it. */
export interface StudentRow extends StudentScoped {
  id: number;
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  status: StudentStatus;
  status_label: string;
  /** "" when the student is not in a class. Not null. */
  class_name: string;
  /** The class's level, or the level applied for when there is no class yet. */
  level_name: string;
  /** The primary contact's name only, or "" when nobody is linked. */
  primary_guardian: string;
  photo_url: string;
  enrolment_date: string | null;
}

/**
 * One move the state machine will accept from where this student stands.
 *
 * Served per student rather than derived on the client, so the drawer can never
 * offer a transition the backend refuses, and the impact sentence under each
 * option is the backend's own wording rather than a second copy of the rule.
 */
export interface AllowedTransition {
  status: StudentStatus;
  label: string;
  impact: string;
  /** Transfers out need a destination school; nothing else does. */
  needs_destination: boolean;
}

export interface StudentDetail extends StudentScoped {
  id: number;
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  /** Computed by the server, so two screens cannot disagree about a birthday. */
  age: number | null;
  gender: Gender | "";
  nationality: string;
  state_of_origin: string;
  address: string;
  phone: string;
  email: string;
  previous_school: string;
  // The five sensitive fields. Gated on school.students.view_sensitive, so a
  // caller without it gets them absent rather than empty - do not read "" as
  // "not recorded" without checking the permission first.
  blood_group?: string;
  allergies?: string;
  conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: StudentStatus;
  status_label: string;
  enrolment_date: string | null;
  class_name: string;
  level_name: string;
  session_name: string;
  applied_for: number | null;
  applied_for_name: string;
  applied_on: string | null;
  photo_url: string;
  allowed_transitions: AllowedTransition[];
  created_at: string;
  updated_at: string;
}

export interface StudentSummary {
  total: number;
  on_roll: number;
  active: number;
  applicants: number;
  unassigned: number;
  by_status: { status: StudentStatus; label: string; count: number }[];
  /**
   * The classes nearest their capacity.
   *
   * The backend returns at most THREE, and only classes with five or fewer
   * seats free, so this is legitimately empty at a half-full school. The
   * design's panel wants the fullest four at any load - until the backend ask
   * lands, the empty case must read as "no class is near capacity" and never
   * as "no class holds any students".
   */
  nearest_capacity: {
    id: number;
    name: string;
    used: number;
    capacity: number;
    remaining: number;
  }[];
  session: string;
}

export interface GuardianSummary {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  /** Whether the guardian has a login of their own. */
  has_account: boolean;
}

/** One guardian as they relate to ONE student. */
export interface StudentGuardianLink {
  id: number;
  guardian: GuardianSummary;
  relationship: string;
  relationship_label: string;
  is_primary: boolean;
  /** The guardian's other children at this school. Empty for an only child. */
  siblings: { id: number; name: string; class: string }[];
}

export interface StudentSubject {
  id: number;
  name: string;
  code: string;
  is_core: boolean;
}

export interface ClassHistoryRow {
  id: number;
  session_name: string;
  class_name: string;
  effective_date: string | null;
  /** Null while this is the current placement. */
  ended_at: string | null;
}

export type DocumentType =
  | "BIRTH_CERTIFICATE"
  | "REPORT_CARD"
  | "PASSPORT_PHOTO"
  | "TRANSFER_CERTIFICATE"
  | "IMMUNISATION";

/**
 * A checklist, not a file list: every type appears, attached or not.
 *
 * So a missing required document is a row that says so, rather than an absence
 * the screen has to infer by diffing against a list it holds itself.
 */
export interface StudentDocumentRow {
  document_type: DocumentType;
  label: string;
  required: boolean;
  attached: boolean;
  uploaded_at: string | null;
  /** Null when nothing is attached. */
  id: number | null;
  /** "" when nothing is attached. */
  url: string;
}

export type HistoryKind = "status" | "class" | "guardian" | "document" | "edit";

/** The profile's History tab: the status log and the audit trail, merged. */
export interface HistoryEntry {
  kind: HistoryKind;
  text: string;
  when: string;
  /** A name, never an email address, and "System" for automated moves. */
  actor: string;
}

/**
 * One hit in the student type-ahead.
 *
 * Four fields, deliberately: the backend refuses to put an address or a
 * guardian's number into a list that appears under somebody's cursor.
 */
export interface StudentSearchHit {
  id: number;
  full_name: string;
  student_number: string;
  /** "" when the student is not in a class. */
  class_name: string;
}

/** The guardian directory row. */
export interface GuardianRow {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  ward_count: number;
  ward_names: string[];
  /** More than one child at this school, so the row stands for a household. */
  is_sibling_household: boolean;
}

export interface GuardianDetail extends GuardianSummary {
  wards: {
    id: number;
    name: string;
    student_number: string;
    status: StudentStatus;
    status_label: string;
    class_name: string;
    relationship: string;
    is_primary: boolean;
  }[];
}

/**
 * One class with its live seat count.
 *
 * Scoped to the active year by the server. A school has one JSS1 A per session
 * and they are all called JSS1 A, so a picker showing two would be offering an
 * option the server refuses on save.
 */
export interface ClassSeats {
  id: number;
  name: string;
  /** Null means school-wide; absent at a single-branch school. */
  branch: number | null;
  branch_name: string | null;
  level: number | null;
  level_name: string;
  /** Null means no limit recorded, which is not the same as full. */
  capacity: number | null;
  used: number;
  /** Null whenever `capacity` is. */
  remaining: number | null;
}

/**
 * The school's own admission-number rule.
 *
 * Note what is NOT here: a suggested next number. The design pre-fills the
 * enrolment field with the next free number and offers a control to reset to
 * it, and nothing in the backend generates one. See the phase 3 backend ask.
 */
export interface AdmissionPolicy {
  required: boolean;
  /** An anchored regular expression, or "" when the school has set no rule. */
  pattern: string;
  hint: string;
  /**
   * The next number in this school's own series, or "" for no suggestion.
   *
   * Derived from the numbers already issued, not from `pattern` - a regular
   * expression cannot be inverted. It is a suggestion and NOT a reservation:
   * two registrars enrolling at once can be handed the same one, and the
   * server's unique constraint is what prevents the collision.
   */
  suggestion: string;
}

/**
 * The editable half of a student record.
 *
 * **Class and status are absent, and that is the contract, not an omission.**
 * Each moves through its own endpoint so it keeps its reason, its effective
 * date and its own audit line: the record has to be able to answer why a child
 * left a class, and a PATCH that quietly changed it could not. The backend's
 * write serializer refuses both, and so does this type.
 *
 * `branch` is refused explicitly too - a school that types a branch and gets a
 * 200 believes the student moved.
 *
 * The three medical fields need `school.students.view_sensitive` to WRITE as
 * well as to read, and `enrolment_date` needs `school.students.manage`. Sending
 * one without the key is a 403, not a silent drop.
 */
export interface StudentWrite {
  student_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  nationality: string;
  state_of_origin: string;
  address: string;
  phone: string;
  email: string;
  previous_school: string;
  blood_group: string;
  allergies: string;
  conditions: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  enrolment_date: string;
}

/**
 * What happened to ONE student in a bulk action.
 *
 * Never all-or-nothing: a caller who selected twenty and mistyped one should
 * not lose the nineteen. `ok` is per row, and a false one carries the reason.
 */
export interface BulkResultRow {
  student: number;
  /** "" when the id matched no student at this school. */
  name: string;
  ok: boolean;
  code: string;
  message: string;
}

/** One guardian on an enrolment: either an existing id, or a new name+phone. */
export interface GuardianOnEnrolment {
  guardian_id?: number;
  full_name?: string;
  phone?: string;
  email?: string;
  relationship: string;
  is_primary: boolean;
}

/**
 * Enrolling a student, or saving them as an applicant.
 *
 * One shape with a flag rather than two, mirroring the backend: two payloads
 * would be two sets of rules, and the second would be the one that forgets the
 * duplicate check.
 *
 * The flag decides which of two fields is required. An enrolment needs
 * `school_class` - a child joining the school joins a class. An applicant needs
 * `applied_for`, a LEVEL, because they have not been placed in anything yet and
 * recording a class for them would claim a seat nobody gave them.
 *
 * `student_number` is optional here even though the design treats it as
 * required. Whether a school issues one, and in what format, is the school's
 * own rule and lives in the admission policy - see AdmissionPolicy.
 */
export interface EnrolWrite {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  nationality?: string;
  state_of_origin?: string;
  address?: string;
  phone?: string;
  email?: string;
  previous_school?: string;
  blood_group?: string;
  allergies?: string;
  conditions?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  student_number?: string;
  enrolment_date?: string;
  /** Required unless `as_applicant`. */
  school_class?: number | null;
  /** A LEVEL id. Required when `as_applicant`. */
  applied_for?: number | null;
  as_applicant?: boolean;
  /** Acknowledgements, never preferences. Send false and let the server ask. */
  allow_over_capacity?: boolean;
  confirm_duplicate?: boolean;
  guardians: GuardianOnEnrolment[];
}

/** The eight the backend accepts. An aunt recorded as OTHER is a contact the
 *  school cannot tell from a neighbour, and it knew which when it typed her in. */
export const RELATIONSHIPS = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "UNCLE", label: "Uncle" },
  { value: "AUNT", label: "Aunt" },
  { value: "GRANDPARENT", label: "Grandparent" },
  { value: "LEGAL_GUARDIAN", label: "Legal guardian" },
  { value: "SIBLING", label: "Sibling" },
  { value: "OTHER", label: "Other" },
] as const;

/** Why a student moved class. Sent as the code, shown as the label. */
export const TRANSFER_REASONS = [
  { value: "PARENT_REQUEST", label: "Parent request" },
  { value: "STREAM_CHANGE", label: "Stream change" },
  { value: "CLASS_BALANCING", label: "Class balancing" },
  { value: "BEHAVIOUR", label: "Behaviour" },
  { value: "ACADEMIC_PLACEMENT", label: "Academic placement" },
  { value: "OTHER", label: "Other" },
] as const;

/** What the directory sends up. Every value is optional; "all" means unset. */
export interface StudentListArgs {
  search?: string;
  /** A class id, or the literal "unassigned" for on-roll students with none. */
  class?: string | number;
  level?: string | number;
  status?: StudentStatus | "ALL";
  /** Omitted at a single-branch school, and when the lens reads "all". */
  branch?: number;
  page?: number;
}
