/**
 * ==========================================================
 *
 * CORE CONVERSATION MEMORY
 * LeadFlow AI
 *
 * ==========================================================
 */

import Conversation from "../models/conversation.js";

/* ==========================================================
   SCHEMA ENUM HELPERS
========================================================== */

const getSchemaEnumValues = (
  path
) => {
  const schemaPath =
    Conversation.schema.path(path);

  if (!schemaPath) {
    return [];
  }

  return Array.isArray(
    schemaPath.enumValues
  )
    ? schemaPath.enumValues
    : [];
};

const getConversationStatusEnum =
  () =>
    getSchemaEnumValues("status");

const getConversationStageEnum =
  () =>
    getSchemaEnumValues("stage");

const getLastQuestionEnum =
  () =>
    getSchemaEnumValues(
      "lastQuestionAsked"
    );

const getAskedQuestionEnum = () => {
  const direct =
    getSchemaEnumValues(
      "askedQuestions.$"
    );

  if (direct.length) {
    return direct;
  }

  const arrayPath =
    Conversation.schema.path(
      "askedQuestions"
    );

  if (
    arrayPath?.caster &&
    Array.isArray(
      arrayPath.caster.enumValues
    )
  ) {
    return arrayPath.caster.enumValues;
  }

  return [];
};

/* ==========================================================
   SAFE STRING
========================================================== */

const safeString = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

/* ==========================================================
   NORMALIZE ORGANIZATION
========================================================== */

const normalizeOrganizationId = (
  organizationId
) => {
  const value =
    safeString(
      organizationId
    );

  return value || null;
};

/* ==========================================================
   TENANT SAFETY
========================================================== */

/*
 * Conversation memory is intentionally passed an already
 * resolved organizationId by the calling layer.
 *
 * This service does not receive req, so it must NOT resolve
 * the organization through req.user / req.organizationId.
 *
 * The checks below ensure that a conversation being mutated
 * actually belongs to an organization and, when a lead is
 * supplied, that the lead belongs to the same organization.
 */

const validateConversationOrganization = (
  conversation
) => {
  if (
    !conversation
  ) {
    return false;
  }

  const conversationOrganizationId =
    normalizeOrganizationId(
      conversation.organizationId
    );

  if (
    !conversationOrganizationId
  ) {
    console.error(
      "❌ Conversation tenant validation failed: conversation has no organizationId.",
      {
        conversationId:
          conversation._id
            ? String(
                conversation._id
              )
            : null,
      }
    );

    return false;
  }

  return true;
};

const validateConversationLeadOrganization = (
  conversation,
  lead
) => {
  if (
    !validateConversationOrganization(
      conversation
    )
  ) {
    return false;
  }

  if (
    !lead
  ) {
    return true;
  }

  const conversationOrganizationId =
    normalizeOrganizationId(
      conversation.organizationId
    );

  const leadOrganizationId =
    normalizeOrganizationId(
      lead.organizationId
    );

  if (
    !leadOrganizationId
  ) {
    console.error(
      "❌ Lead tenant validation failed: lead has no organizationId.",
      {
        leadId:
          lead._id
            ? String(
                lead._id
              )
            : null,

        conversationId:
          conversation._id
            ? String(
                conversation._id
              )
            : null,
      }
    );

    return false;
  }

  if (
    conversationOrganizationId !==
    leadOrganizationId
  ) {
    console.error(
      "❌ Conversation/Lead tenant mismatch detected.",
      {
        conversationId:
          conversation._id
            ? String(
                conversation._id
              )
            : null,

        conversationOrganizationId,

        leadId:
          lead._id
            ? String(
                lead._id
              )
            : null,

        leadOrganizationId,
      }
    );

    return false;
  }

  return true;
};

/* ==========================================================
   NORMALIZE CUSTOMER
========================================================== */

const normalizeCustomerName = (
  customerName
) =>
  safeString(
    customerName
  );

/* ==========================================================
   NORMALIZE PHONE
========================================================== */

const normalizePhone = (
  phone
) =>
  safeString(
    phone
  );

/* ==========================================================
   SAFE STATUS
========================================================== */

const getDefaultConversationStatus =
  () => {
    const statuses =
      getConversationStatusEnum();

    console.log(
      "🧠 Conversation status enum:",
      statuses
    );

    if (
      statuses.includes(
        "new"
      )
    ) {
      return "new";
    }

    if (
      statuses.includes(
        "active"
      )
    ) {
      return "active";
    }

    if (
      statuses.includes(
        "pending"
      )
    ) {
      return "pending";
    }

    return (
      statuses[0] ||
      null
    );
  };

/* ==========================================================
   SAFE ACTIVE / INCOMPLETE STATUS
========================================================== */

const getIncompleteStatus =
  () => {
    const statuses =
      getConversationStatusEnum();

    if (
      statuses.includes(
        "active"
      )
    ) {
      return "active";
    }

    if (
      statuses.includes(
        "pending"
      )
    ) {
      return "pending";
    }

    if (
      statuses.includes(
        "new"
      )
    ) {
      return "new";
    }

    return (
      statuses[0] ||
      null
    );
  };

/* ==========================================================
   SAFE QUALIFIED STATUS
========================================================== */

const getQualifiedStatus =
  () => {
    const statuses =
      getConversationStatusEnum();

    /*
     * IMPORTANT:
     *
     * Never blindly assign "qualified".
     *
     * Runtime schema is authoritative.
     */

    if (
      statuses.includes(
        "qualified"
      )
    ) {
      return "qualified";
    }

    /*
     * Some older LeadFlow AI schemas use
     * pending while stage/complete identify
     * qualification completion.
     */

    if (
      statuses.includes(
        "pending"
      )
    ) {
      console.warn(
        "⚠️ Conversation status enum does not contain 'qualified'. Using 'pending' while stage='qualified' and complete=true."
      );

      return "pending";
    }

    return (
      statuses[0] ||
      null
    );
  };

/* ==========================================================
   DEFAULT STAGE
========================================================== */

const getDefaultConversationStage =
  () => {
    const stages =
      getConversationStageEnum();

    if (
      stages.includes(
        "collect_location"
      )
    ) {
      return "collect_location";
    }

    if (
      stages.includes(
        "new"
      )
    ) {
      return "new";
    }

    return (
      stages[0] ||
      null
    );
  };

/* ==========================================================
   QUALIFICATION STAGE
========================================================== */

const getQualificationStage =
  (
    field
  ) => {
    const stages =
      getConversationStageEnum();

    if (
      !field
    ) {
      return null;
    }

    const candidate =
      `collect_${field}`;

    if (
      stages.includes(
        candidate
      )
    ) {
      return candidate;
    }

    if (
      stages.includes(
        "qualifying"
      )
    ) {
      return "qualifying";
    }

    return null;
  };

/* ==========================================================
   QUALIFIED STAGE
========================================================== */

const getQualifiedStage =
  () => {
    const stages =
      getConversationStageEnum();

    if (
      stages.includes(
        "qualified"
      )
    ) {
      return "qualified";
    }

    return null;
  };

/* ==========================================================
   DEFAULT MISSING FIELDS
========================================================== */

const buildDefaultMissingFields =
  (
    phone
  ) => ({
    location: true,

    budget: true,

    bedrooms: true,

    moveDate: true,

    phone: !phone,
  });

/* ==========================================================
   DEFAULT SUMMARY
========================================================== */

const buildDefaultSummary =
  (
    phone
  ) => ({
    budget: "",

    location: "",

    bedrooms: "",

    moveDate: "",

    phone:
      phone || "",

    intent: "",
  });

/* ==========================================================
   GET / CREATE CONVERSATION
========================================================== */

export const getConversationContext =
  async (
    organizationId,
    customerName,
    phone
  ) => {
    console.log(
      "📚 Loading conversation for:",
      {
        organizationId,
        customerName,
        phone,
      }
    );

    const normalizedOrganizationId =
      normalizeOrganizationId(
        organizationId
      );

    if (
      !normalizedOrganizationId
    ) {
      throw new Error(
        "organizationId is required to load conversation context."
      );
    }

    const normalizedName =
      normalizeCustomerName(
        customerName
      );

    const normalizedPhone =
      normalizePhone(
        phone
      );

    let conversation =
      null;

    /* --------------------------------------------------------
       PRIMARY LOOKUP
    -------------------------------------------------------- */

    if (
      normalizedPhone
    ) {
      conversation =
        await Conversation.findOne({
          organizationId:
            normalizedOrganizationId,

          phone:
            normalizedPhone,
        }).sort({
          updatedAt: -1,
        });
    }

    /* --------------------------------------------------------
       FALLBACK LOOKUP
    -------------------------------------------------------- */

    if (
      !conversation &&
      normalizedName
    ) {
      conversation =
        await Conversation.findOne({
          organizationId:
            normalizedOrganizationId,

          customerName:
            normalizedName,
        }).sort({
          updatedAt: -1,
        });
    }

    /* --------------------------------------------------------
       CREATE
    -------------------------------------------------------- */

    if (
      !conversation
    ) {
      const status =
        getDefaultConversationStatus();

      const stage =
        getDefaultConversationStage();

      if (!status) {
        throw new Error(
          "Conversation status enum has no usable value."
        );
      }

      if (!stage) {
        throw new Error(
          "Conversation stage enum has no usable value."
        );
      }

      console.log(
        "🧠 Creating conversation:",
        {
          status,
          stage,
          organizationId:
            normalizedOrganizationId,
        }
      );

      conversation =
        await Conversation.create({
          /*
           * IMPORTANT:
           * Conversation creation is always explicitly
           * tenant-scoped.
           */
          organizationId:
            normalizedOrganizationId,

          customerName:
            normalizedName ||
            "Unknown",

          phone:
            normalizedPhone,

          status,

          stage,

          complete:
            false,

          askedQuestions: [],

          lastQuestionAsked:
            null,

          missingFields:
            buildDefaultMissingFields(
              normalizedPhone
            ),

          summary:
            buildDefaultSummary(
              normalizedPhone
            ),

          lastUpdated:
            new Date(),
        });

      console.log(
        "🆕 New conversation created:",
        String(
          conversation._id
        )
      );
    } else {
      /*
       * Existing conversations are returned only after
       * the organizationId was included in the lookup.
       *
       * Keep this explicit guard so malformed legacy
       * documents cannot silently enter the memory layer.
       */
      if (
        !validateConversationOrganization(
          conversation
        )
      ) {
        throw new Error(
          "Conversation does not belong to a valid organization."
        );
      }

      const conversationOrganizationId =
        normalizeOrganizationId(
          conversation.organizationId
        );

      if (
        conversationOrganizationId !==
        normalizedOrganizationId
      ) {
        throw new Error(
          "Conversation organization does not match the requested organization."
        );
      }

      console.log(
        "♻️ Existing conversation loaded:",
        String(
          conversation._id
        )
      );
    }

    console.log(
      "📚 Conversation Context:"
    );

    console.dir(
      conversation.toObject(),
      {
        depth: null,
      }
    );

    return conversation;
  };

/* ==========================================================
   MISSING FIELDS
========================================================== */

export const getMissingFields =
  (
    lead
  ) => {
    const missing = [];

    if (!lead) {
      return [
        "location",
        "budget",
        "bedrooms",
        "moveDate",
        "phone",
      ];
    }

    if (
      !lead.location
    ) {
      missing.push(
        "location"
      );
    }

    if (
      lead.budget ===
        undefined ||
      lead.budget ===
        null ||
      lead.budget === ""
    ) {
      missing.push(
        "budget"
      );
    }

    if (
      lead.bedrooms ===
        undefined ||
      lead.bedrooms ===
        null ||
      lead.bedrooms === ""
    ) {
      missing.push(
        "bedrooms"
      );
    }

    if (
      !lead.moveDate
    ) {
      missing.push(
        "moveDate"
      );
    }

    if (
      !lead.phone
    ) {
      missing.push(
        "phone"
      );
    }

    console.log(
      "🧠 Missing Fields:",
      missing
    );

    return missing;
  };

/* ==========================================================
   DETECT STAGE
========================================================== */

export const detectConversationStage =
  (
    lead
  ) => {
    console.log(
      "🧠 Detecting conversation stage for lead:",
      lead
    );

    const missing =
      getMissingFields(
        lead
      );

    /* --------------------------------------------------------
       COMPLETE
    -------------------------------------------------------- */

    if (
      missing.length ===
      0
    ) {
      const qualifiedStage =
        getQualifiedStage();

      if (
        qualifiedStage
      ) {
        console.log(
          "🧠 Detected stage: qualified"
        );

        return qualifiedStage;
      }
    }

    /* --------------------------------------------------------
       INCOMPLETE
    -------------------------------------------------------- */

    const nextField =
      missing[0];

    const fieldStage =
      getQualificationStage(
        nextField
      );

    if (
      fieldStage
    ) {
      console.log(
        "🧠 Detected stage:",
        fieldStage
      );

      return fieldStage;
    }

    /* --------------------------------------------------------
       FALLBACK
    -------------------------------------------------------- */

    return getDefaultConversationStage();
  };

/* ==========================================================
   NEXT QUESTION
========================================================== */

export const getNextQuestion =
  (
    lead
  ) => {
    const missing =
      getMissingFields(
        lead
      );

    const next =
      missing[0];

    console.log(
      "❓ Next Step:",
      next
    );

    switch (
      next
    ) {
      case "location":
        return "Which location are you interested in?";

      case "budget":
        return "What budget range are you considering?";

      case "bedrooms":
        return "How many bedrooms do you need?";

      case "moveDate":
        return "When would you like to move?";

      case "phone":
        return "What phone number should we use?";

      default:
        return null;
    }
  };

/* ==========================================================
   RECORD ASKED QUESTION
========================================================== */

export const recordAskedQuestion =
  async (
    conversation,
    questionField
  ) => {
    if (
      !conversation ||
      !questionField
    ) {
      return conversation;
    }

    /*
     * Tenant safety:
     *
     * This function receives an existing conversation
     * document rather than req, so the centralized request
     * resolver cannot be used here.
     *
     * Ensure the document being mutated is tenant-bound
     * before saving it.
     */
    if (
      !validateConversationOrganization(
        conversation
      )
    ) {
      throw new Error(
        "Cannot update conversation without a valid organizationId."
      );
    }

    const validQuestions =
      getAskedQuestionEnum();

    if (
      validQuestions.length &&
      !validQuestions.includes(
        questionField
      )
    ) {
      console.warn(
        "⚠️ Invalid qualification question:",
        questionField
      );

      return conversation;
    }

    if (
      !Array.isArray(
        conversation.askedQuestions
      )
    ) {
      conversation.askedQuestions =
        [];
    }

    if (
      !conversation.askedQuestions.includes(
        questionField
      )
    ) {
      conversation.askedQuestions.push(
        questionField
      );
    }

    const lastQuestionEnum =
      getLastQuestionEnum();

    if (
      lastQuestionEnum.includes(
        questionField
      )
    ) {
      conversation.lastQuestionAsked =
        questionField;
    }

    const fieldStage =
      getQualificationStage(
        questionField
      );

    if (
      fieldStage
    ) {
      conversation.stage =
        fieldStage;
    }

    const incompleteStatus =
      getIncompleteStatus();

    if (
      incompleteStatus
    ) {
      conversation.status =
        incompleteStatus;
    }

    conversation.complete =
      false;

    conversation.lastUpdated =
      new Date();

    await conversation.save();

    console.log(
      "📝 Question recorded:",
      questionField
    );

    console.log(
      "🧠 Conversation stage:",
      conversation.stage
    );

    console.log(
      "🧠 Conversation status:",
      conversation.status
    );

    console.log(
      "🧠 Asked questions:",
      conversation.askedQuestions
    );

    console.log(
      "❓ Last question asked:",
      conversation.lastQuestionAsked
    );

    return conversation;
  };

/* ==========================================================
   UPDATE QUALIFICATION MEMORY
========================================================== */

export const updateConversationQualification =
  async (
    conversation,
    lead
  ) => {
    if (
      !conversation ||
      !lead
    ) {
      return conversation;
    }

    /*
     * Tenant isolation:
     *
     * The controller/service layer resolves the organization
     * before loading the conversation. At this point we make
     * sure the conversation and lead still belong to the same
     * organization before allowing qualification memory to
     * mutate and save.
     */
    if (
      !validateConversationLeadOrganization(
        conversation,
        lead
      )
    ) {
      throw new Error(
        "Conversation and lead organization mismatch."
      );
    }

    const missing =
      getMissingFields(
        lead
      );

    /* --------------------------------------------------------
       MISSING FIELDS
    -------------------------------------------------------- */

    conversation.missingFields =
      {
        location:
          missing.includes(
            "location"
          ),

        budget:
          missing.includes(
            "budget"
          ),

        bedrooms:
          missing.includes(
            "bedrooms"
          ),

        moveDate:
          missing.includes(
            "moveDate"
          ),

        phone:
          missing.includes(
            "phone"
          ),
      };

    /* --------------------------------------------------------
       STAGE
    -------------------------------------------------------- */

    const stage =
      detectConversationStage(
        lead
      );

    if (
      stage
    ) {
      conversation.stage =
        stage;
    }

    /* --------------------------------------------------------
       COMPLETE
    -------------------------------------------------------- */

    conversation.complete =
      missing.length ===
      0;

    /* --------------------------------------------------------
       STATUS
    -------------------------------------------------------- */

    const status =
      conversation.complete
        ? getQualifiedStatus()
        : getIncompleteStatus();

    if (
      status
    ) {
      conversation.status =
        status;
    }

    /* --------------------------------------------------------
       SUMMARY
    -------------------------------------------------------- */

    conversation.summary =
      {
        budget:
          lead.budget !==
            undefined &&
          lead.budget !==
            null
            ? String(
                lead.budget
              )
            : "",

        location:
          lead.location
            ? String(
                lead.location
              )
            : "",

        bedrooms:
          lead.bedrooms !==
            undefined &&
          lead.bedrooms !==
            null
            ? String(
                lead.bedrooms
              )
            : "",

        moveDate:
          lead.moveDate
            ? String(
                lead.moveDate
              )
            : "",

        phone:
          lead.phone
            ? String(
                lead.phone
              ).trim()
            : "",

        /*
         * Lead.intent remains the source
         * of truth.
         */
        intent:
          lead.intent !==
            undefined &&
          lead.intent !==
            null
            ? String(
                lead.intent
              ).trim()
            : "",
      };

    /* --------------------------------------------------------
       LEAD LINK
    -------------------------------------------------------- */

    if (
      lead._id
    ) {
      conversation.leadId =
        lead._id;
    }

    /* --------------------------------------------------------
       CUSTOMER PHONE
    -------------------------------------------------------- */

    if (
      lead.phone
    ) {
      conversation.phone =
        String(
          lead.phone
        ).trim();
    }

    /* --------------------------------------------------------
       CUSTOMER NAME
    -------------------------------------------------------- */

    if (
      lead.name
    ) {
      conversation.customerName =
        String(
          lead.name
        ).trim();
    }

    conversation.lastUpdated =
      new Date();

    /* --------------------------------------------------------
       DEBUG
    -------------------------------------------------------- */

    console.log(
      "🧠 Conversation qualification state before save:"
    );

    console.dir(
      {
        organizationId:
          conversation.organizationId,

        stage:
          conversation.stage,

        status:
          conversation.status,

        complete:
          conversation.complete,

        missingFields:
          conversation.missingFields,

        summary:
          conversation.summary,

        leadId:
          conversation.leadId,

        lastQuestionAsked:
          conversation.lastQuestionAsked,

        askedQuestions:
          conversation.askedQuestions,
      },
      {
        depth: null,
      }
    );

    /* --------------------------------------------------------
       FINAL SCHEMA SAFETY CHECK
    -------------------------------------------------------- */

    const statusEnum =
      getConversationStatusEnum();

    if (
      conversation.status &&
      !statusEnum.includes(
        conversation.status
      )
    ) {
      console.error(
        "❌ Conversation status is not accepted by runtime schema:",
        {
          status:
            conversation.status,

          allowed:
            statusEnum,
        }
      );

      conversation.status =
        statusEnum.includes(
          "pending"
        )
          ? "pending"
          : statusEnum[0];
    }

    const stageEnum =
      getConversationStageEnum();

    if (
      conversation.stage &&
      !stageEnum.includes(
        conversation.stage
      )
    ) {
      console.error(
        "❌ Conversation stage is not accepted by runtime schema:",
        {
          stage:
            conversation.stage,

          allowed:
            stageEnum,
        }
      );

      conversation.stage =
        stageEnum[0];
    }

    /* --------------------------------------------------------
       SAVE
    -------------------------------------------------------- */

    await conversation.save();

    console.log(
      "🧠 Conversation qualification synchronized."
    );

    console.log(
      "🧠 Final Conversation Organization:",
      conversation.organizationId
    );

    console.log(
      "🧠 Final Conversation Stage:",
      conversation.stage
    );

    console.log(
      "🧠 Final Conversation Status:",
      conversation.status
    );

    console.log(
      "🧠 Final Conversation Complete:",
      conversation.complete
    );

    console.log(
      "🧠 Final Missing Fields:",
      conversation.missingFields
    );

    console.log(
      "🧠 Final Lead Intent:",
      lead.intent
    );

    console.log(
      "🧠 Final Conversation Intent:",
      conversation.summary?.intent
    );

    return conversation;
  };

/* ==========================================================
   EXPORT
========================================================== */

export default {
  getConversationContext,

  getMissingFields,

  detectConversationStage,

  getNextQuestion,

  recordAskedQuestion,

  updateConversationQualification,
};