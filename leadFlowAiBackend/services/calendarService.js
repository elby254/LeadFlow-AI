/**
 * ==========================================================
 *
 * LeadFlow AI Calendar Integration Service
 *
 * Responsibilities
 * ----------------------------------------------------------
 * ✓ Google Calendar
 * ✓ Outlook Calendar
 * ✓ ICS Generation
 * ✓ Meeting Reminders
 *
 * Part 1
 * ----------------------------------------------------------
 * ✓ Google Calendar Event Builder
 *
 * ==========================================================
 */

import { google } from "googleapis";

/* ==========================================================
   GOOGLE OAUTH CLIENT
========================================================== */

const oauth2Client =
  new google.auth.OAuth2(

    process.env.GOOGLE_CLIENT_ID,

    process.env.GOOGLE_CLIENT_SECRET,

    process.env.GOOGLE_REDIRECT_URI

  );

/* ==========================================================
   GOOGLE CALENDAR INSTANCE
========================================================== */

const calendar =
  google.calendar({

    version: "v3",

    auth: oauth2Client,

  });

/* ==========================================================
   CREATE GOOGLE CALENDAR EVENT
========================================================== */

export const createGoogleCalendarEvent =
async ({

  accessToken,

  viewing,

  lead,

  property,

  agent,

}) => {

  oauth2Client.setCredentials({

    access_token: accessToken,

  });

  const event = {

    summary:
      `Property Viewing • ${property.title}`,

    description: `

Customer:
${lead.name}

Phone:
${lead.phone}

Property:
${property.title}

Location:
${property.location}

Agent:
${agent.name}

LeadFlow AI Viewing

`,

    location:
      viewing.location.address,

    start: {

      dateTime:
        new Date(
          viewing.viewingDate
        ).toISOString(),

      timeZone:
        viewing.timezone,

    },

    end: {

      dateTime:
        new Date(
          viewing.viewingDate
        ).toISOString(),

      timeZone:
        viewing.timezone,

    },

    attendees: [

      {
        email:
          agent.email,
      },

      ...(lead.email
        ? [
            {
              email:
                lead.email,
            },
          ]
        : []),

    ],

    reminders: {

      useDefault: false,

      overrides: [

        {

          method: "email",

          minutes: 1440,

        },

        {

          method: "popup",

          minutes: 60,

        },

      ],

    },

  };

  const response =
    await calendar.events.insert({

      calendarId: "primary",

      requestBody: event,

    });

  return {

    eventId:
      response.data.id,

    htmlLink:
      response.data.htmlLink,

    hangoutLink:
      response.data.hangoutLink ||

      null,

  };

};

/* ==========================================================
   ICS (iCalendar) GENERATION
========================================================== */

import { createEvents } from "ics";

/* ==========================================================
   GENERATE ICS FILE
========================================================== */

export const generateICSFile =
async ({

  viewing,

  lead,

  property,

  agent,

}) => {

  const startDate =
    new Date(viewing.viewingDate);

  const endDate =
    new Date(viewing.viewingDate);

  endDate.setMinutes(

    endDate.getMinutes() +

    (viewing.durationMinutes || 60)

  );

  const event = {

    title:
      `Property Viewing • ${property.title}`,

    description: `

Customer: ${lead.name}

Phone: ${lead.phone}

Agent: ${agent.name}

Property: ${property.title}

Location: ${property.location}

LeadFlow AI

`,

    location:
      viewing.location.address,

    start: [

      startDate.getFullYear(),

      startDate.getMonth() + 1,

      startDate.getDate(),

      startDate.getHours(),

      startDate.getMinutes(),

    ],

    end: [

      endDate.getFullYear(),

      endDate.getMonth() + 1,

      endDate.getDate(),

      endDate.getHours(),

      endDate.getMinutes(),

    ],

    organizer: {

      name:
        agent.name,

      email:
        agent.email,

    },

    attendees: [

      {

        name:
          agent.name,

        email:
          agent.email,

        rsvp: true,

      },

      ...(lead.email

        ? [

            {

              name:
                lead.name,

              email:
                lead.email,

              rsvp: true,

            },

          ]

        : []),

    ],

    status:
      "CONFIRMED",

    busyStatus:
      "BUSY",

    categories: [

      "LeadFlow AI",

      "Property Viewing",

    ],

  };

  const {

    error,

    value,

  } = createEvents([event]);

  if (error) {

    throw error;

  }

  return value;

};

/* ==========================================================
   DOWNLOADABLE ICS METADATA
========================================================== */

export const buildICSResponse =
async (params) => {

  const ics =
    await generateICSFile(params);

  return {

    filename:

      `viewing-${params.viewing._id}.ics`,

    mimeType:

      "text/calendar",

    content:

      ics,

  };

};

/* ==========================================================
   REMINDER HELPERS
========================================================== */

/**
 * Returns whether a reminder should be sent.
 */

export const shouldSendReminder = (
  viewing,
  minutesBefore
) => {

  const now = new Date();

  const viewingTime =
    new Date(viewing.viewingDate);

  const reminderTime =
    new Date(
      viewingTime.getTime() -
      (minutesBefore * 60 * 1000)
    );

  return (
    now >= reminderTime &&
    now < viewingTime
  );
};

/* ==========================================================
   BUILD REMINDER MESSAGE
========================================================== */

export const buildReminderMessage = ({
  viewing,
  lead,
  property,
}) => {

  return `Reminder

You have a scheduled property viewing.

Property:
${property.title}

Location:
${viewing.location.address}

Date:
${new Date(viewing.viewingDate).toLocaleDateString()}

Time:
${viewing.startTime}

Please arrive a few minutes early.

LeadFlow AI`;
};

/* ==========================================================
   PROCESS VIEWING REMINDERS
========================================================== */

export const processViewingReminders =
async (viewings = []) => {

  const reminders = [];

  for (const viewing of viewings) {

    /* -------------------------------
       24 Hour Reminder
    -------------------------------- */

    if (
      shouldSendReminder(
        viewing,
        1440
      ) &&
      !viewing.reminders.oneDayBefore
    ) {

      reminders.push({

        viewingId:
          viewing._id,

        type:
          "24_hours",

      });

      viewing.reminders.oneDayBefore =
        true;

      viewing.reminders.sentAt.push(
        new Date()
      );

      await viewing.save();
    }

    /* -------------------------------
       1 Hour Reminder
    -------------------------------- */

    if (
      shouldSendReminder(
        viewing,
        60
      ) &&
      !viewing.reminders.oneHourBefore
    ) {

      reminders.push({

        viewingId:
          viewing._id,

        type:
          "1_hour",

      });

      viewing.reminders.oneHourBefore =
        true;

      viewing.reminders.sentAt.push(
        new Date()
      );

      await viewing.save();
    }

  }

  return reminders;
};

/* ==========================================================
   EXPORT
========================================================== */

export default {

  /* Google */

  createGoogleCalendarEvent,

  /* Outlook */

  createOutlookCalendarEvent,

  updateOutlookCalendarEvent,

  deleteOutlookCalendarEvent,

  /* ICS */

  generateICSFile,

  buildICSResponse,

  /* Reminders */

  shouldSendReminder,

  buildReminderMessage,

  processViewingReminders,

};