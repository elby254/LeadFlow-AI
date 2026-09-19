// ======================================================
// services/calendarService.js
// LeadFlow AI
// Calendar API Service
// ======================================================

import axiosClient from "../api/axiosClient";

const BASE_URL = "/calendar";

// ======================================================
// GET CALENDAR
// ======================================================

const getCalendar = async (date, params = {}) => {

  const response = await axiosClient.get(

    BASE_URL,

    {
      params: {
        date,
        ...params,
      },
    }

  );

  return response.data;

};

// ======================================================
// GET AVAILABLE SLOTS
// ======================================================

const getAvailableSlots = async (

  date,

  agentId = null

) => {

  const response = await axiosClient.get(

    `${BASE_URL}/available-slots`,

    {
      params: {
        date,
        agentId,
      },
    }

  );

  return response.data;

};

// ======================================================
// GET DAY SCHEDULE
// ======================================================

const getDaySchedule = async (

  date,

  agentId = null

) => {

  const response = await axiosClient.get(

    `${BASE_URL}/day`,

    {
      params: {
        date,
        agentId,
      },
    }

  );

  return response.data;

};

// ======================================================
// GET WEEK SCHEDULE
// ======================================================

const getWeekSchedule = async (

  week,

  year,

  agentId = null

) => {

  const response = await axiosClient.get(

    `${BASE_URL}/week`,

    {
      params: {
        week,
        year,
        agentId,
      },
    }

  );

  return response.data;

};

// ======================================================
// GET MONTH SCHEDULE
// ======================================================

const getMonthSchedule = async (

  month,

  year,

  agentId = null

) => {

  const response = await axiosClient.get(

    `${BASE_URL}/month`,

    {
      params: {
        month,
        year,
        agentId,
      },
    }

  );

  return response.data;

};

// ======================================================
// BLOCK CALENDAR DATE
// ======================================================

const blockCalendarDate = async (

  payload

) => {

  const response = await axiosClient.post(

    `${BASE_URL}/block`,

    payload

  );

  return response.data;

};

// ======================================================
// UNBLOCK CALENDAR DATE
// ======================================================

const unblockCalendarDate = async (

  blockId

) => {

  const response = await axiosClient.delete(

    `${BASE_URL}/block/${blockId}`

  );

  return response.data;

};

// ======================================================
// SYNC CALENDAR
// ======================================================

const syncCalendar = async (

  payload = {}

) => {

  const response = await axiosClient.post(

    `${BASE_URL}/sync`,

    payload

  );

  return response.data;

};

// ======================================================
// EXPORT CALENDAR
// ======================================================

const exportCalendar = async (

  params = {}

) => {

  const response = await axiosClient.get(

    `${BASE_URL}/export`,

    {
      params,
      responseType: "blob",
    }

  );

  return response.data;

};

// ======================================================
// EXPORT
// ======================================================

const calendarService = {

  getCalendar,

  getAvailableSlots,

  getDaySchedule,

  getWeekSchedule,

  getMonthSchedule,

  blockCalendarDate,

  unblockCalendarDate,

  syncCalendar,

  exportCalendar,

};

export default calendarService;