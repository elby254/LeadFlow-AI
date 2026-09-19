// ======================================================
// Notification API Service
// ======================================================

import axiosClient from "../api/axiosClient";

const BASE_URL = "/notifications";

// ======================================================
// GET ALL NOTIFICATIONS
// ======================================================

const getNotifications = async (params = {}) => {

  const response = await axiosClient.get(

    BASE_URL,

    {
      params,
    }

  );

  return response.data;

};

// ======================================================
// GET SINGLE NOTIFICATION
// ======================================================

const getNotification = async (notificationId) => {

  const response = await axiosClient.get(

    `${BASE_URL}/${notificationId}`

  );

  return response.data;

};

// ======================================================
// CREATE NOTIFICATION
// ======================================================

const createNotification = async (payload) => {

  const response = await axiosClient.post(

    BASE_URL,

    payload

  );

  return response.data;

};

// ======================================================
// UPDATE NOTIFICATION
// ======================================================

const updateNotification = async (

  notificationId,

  payload

) => {

  const response = await axiosClient.put(

    `${BASE_URL}/${notificationId}`,

    payload

  );

  return response.data;

};

// ======================================================
// DELETE NOTIFICATION
// ======================================================

const deleteNotification = async (

  notificationId

) => {

  const response = await axiosClient.delete(

    `${BASE_URL}/${notificationId}`

  );

  return response.data;

};

// ======================================================
// MARK AS READ
// ======================================================

const markAsRead = async (

  notificationId

) => {

  const response = await axiosClient.patch(

    `${BASE_URL}/${notificationId}/read`

  );

  return response.data;

};

// ======================================================
// MARK ALL AS READ
// ======================================================

const markAllAsRead = async () => {

  const response = await axiosClient.patch(

    `${BASE_URL}/read-all`

  );

  return response.data;

};

// ======================================================
// ARCHIVE NOTIFICATION
// ======================================================

const archiveNotification = async (

  notificationId

) => {

  const response = await axiosClient.patch(

    `${BASE_URL}/${notificationId}/archive`

  );

  return response.data;

};

// ======================================================
// RESTORE NOTIFICATION
// ======================================================

const restoreNotification = async (

  notificationId

) => {

  const response = await axiosClient.patch(

    `${BASE_URL}/${notificationId}/restore`

  );

  return response.data;

};

// ======================================================
// SEND NOTIFICATION
// ======================================================

const sendNotification = async (

  payload

) => {

  const response = await axiosClient.post(

    `${BASE_URL}/send`,

    payload

  );

  return response.data;

};

// ======================================================
// EXPORT
// ======================================================

const notificationService = {

  getNotifications,
  getNotification,

  createNotification,
  updateNotification,
  deleteNotification,

  markAsRead,
  markAllAsRead,

  archiveNotification,
  restoreNotification,

  sendNotification,

};

export default notificationService;