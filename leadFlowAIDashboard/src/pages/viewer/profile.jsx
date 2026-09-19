/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Displays and allows editing of the
 * logged-in viewer's profile.
 *
 * Features
 * ----------------------------------------------------------
 * • Personal Information
 * • Contact Details
 * • Account Statistics
 * • Profile Update
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {

  User,

  Mail,

  Phone,

  MapPin,

  Save,

} from "lucide-react";

import userService from "../../services/userService";

const Profile = () => {

  /*
  ==========================================================
  PROFILE
  ==========================================================
  */

  const [

    profile,

    setProfile,

  ] = useState({

    firstName: "",

    lastName: "",

    email: "",

    phone: "",

    location: "",

  });

  /*
  ==========================================================
  ACCOUNT STATS
  ==========================================================
  */

  const [

    statistics,

    setStatistics,

  ] = useState({

    savedProperties: 0,

    viewedProperties: 0,

    viewingRequests: 0,

  });

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    saving,

    setSaving,

  ] = useState(false);

/*
==========================================================
LOAD PROFILE
==========================================================
*/

const loadProfile = async () => {

  try {

    setLoading(true);

    const response =

      await userService.getProfile();

    /*
    Expected Backend

    {
      data:{
        firstName,
        lastName,
        email,
        phone,
        location
      }
    }
    */

    setProfile({

      firstName:

        response?.data?.firstName || "",

      lastName:

        response?.data?.lastName || "",

      email:

        response?.data?.email || "",

      phone:

        response?.data?.phone || "",

      location:

        response?.data?.location || "",

    });

  } catch (error) {

    console.error(

      "Unable to load profile",

      error

    );

  }

};

/*
==========================================================
LOAD ACCOUNT STATS
==========================================================
*/

const loadStatistics = async () => {

  try {

    const response =

      await userService.getProfileStatistics();

    /*
    Expected

    {
      data:{
        savedProperties,
        viewedProperties,
        viewingRequests
      }
    }
    */

    setStatistics({

      savedProperties:

        response?.data?.savedProperties ||

        0,

      viewedProperties:

        response?.data?.viewedProperties ||

        0,

      viewingRequests:

        response?.data?.viewingRequests ||

        0,

    });

  } catch (error) {

    console.error(

      "Unable to load statistics",

      error

    );

  }

};

/*
==========================================================
INITIAL LOAD
==========================================================
*/

useEffect(() => {

  const initialise = async () => {

    await loadProfile();

    await loadStatistics();

    setLoading(false);

  };

  initialise();

}, []);

/*
==========================================================
INPUT CHANGE
==========================================================
*/

const handleChange = (event) => {

  const {

    name,

    value,

  } = event.target;

  setProfile((previous) => ({

    ...previous,

    [name]: value,

  }));

};

/*
==========================================================
SAVE PROFILE
==========================================================
*/

const handleSave = async () => {

  try {

    setSaving(true);

    await userService.updateProfile(

      profile

    );

    alert(

      "Profile updated successfully."

    );

  } catch (error) {

    console.error(

      "Unable to save profile",

      error

    );

    alert(

      "Profile update failed."

    );

  } finally {

    setSaving(false);

  }

};

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading profile...

        </p>

      </div>

    );

  }

  /*
  ==========================================================
  PAGE
  ==========================================================
  */

  return (

    <section className="mx-auto max-w-6xl space-y-10">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          My Profile

        </h1>

        <p className="text-muted-foreground">

          Manage your personal information and
          account details.

        </p>

      </div>

      {/* ======================================================
          ACCOUNT STATISTICS
      ====================================================== */}

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-xl border bg-card p-6">

          <h3 className="text-sm text-muted-foreground">

            Saved Properties

          </h3>

          <p className="mt-2 text-3xl font-bold">

            {statistics.savedProperties}

          </p>

        </div>

        <div className="rounded-xl border bg-card p-6">

          <h3 className="text-sm text-muted-foreground">

            Viewed Properties

          </h3>

          <p className="mt-2 text-3xl font-bold">

            {statistics.viewedProperties}

          </p>

        </div>

        <div className="rounded-xl border bg-card p-6">

          <h3 className="text-sm text-muted-foreground">

            Viewing Requests

          </h3>

          <p className="mt-2 text-3xl font-bold">

            {statistics.viewingRequests}

          </p>

        </div>

      </div>

      {/* ======================================================
          PROFILE FORM
      ====================================================== */}

      <div className="rounded-2xl border bg-card p-8">

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium">

              <User className="mr-2 inline h-4 w-4" />

              First Name

            </label>

            <input

              type="text"

              name="firstName"

              value={profile.firstName}

              onChange={handleChange}

              className="w-full rounded-lg border bg-background px-4 py-3"

            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">

              <User className="mr-2 inline h-4 w-4" />

              Last Name

            </label>

            <input

              type="text"

              name="lastName"

              value={profile.lastName}

              onChange={handleChange}

              className="w-full rounded-lg border bg-background px-4 py-3"

            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">

              <Mail className="mr-2 inline h-4 w-4" />

              Email

            </label>

            <input

              type="email"

              name="email"

              value={profile.email}

              onChange={handleChange}

              className="w-full rounded-lg border bg-background px-4 py-3"

            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium">

              <Phone className="mr-2 inline h-4 w-4" />

              Phone

            </label>

            <input

              type="text"

              name="phone"

              value={profile.phone}

              onChange={handleChange}

              className="w-full rounded-lg border bg-background px-4 py-3"

            />

          </div>

          <div className="md:col-span-2">

            <label className="mb-2 block text-sm font-medium">

              <MapPin className="mr-2 inline h-4 w-4" />

              Location

            </label>

            <input

              type="text"

              name="location"

              value={profile.location}

              onChange={handleChange}

              className="w-full rounded-lg border bg-background px-4 py-3"

            />

          </div>

        </div>

        {/* ======================================================
            SAVE
        ====================================================== */}

        <div className="mt-8 flex justify-end">

          <button

            type="button"

            onClick={handleSave}

            disabled={saving}

            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"

          >

            <Save size={18} />

            {saving

              ? "Saving..."

              : "Save Changes"}

          </button>

        </div>

      </div>

    </section>

  );

};

export default Profile;