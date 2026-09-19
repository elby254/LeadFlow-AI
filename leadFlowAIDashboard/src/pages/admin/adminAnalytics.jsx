/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Executive reporting dashboard.
 *
 * Features
 * ----------------------------------------------------------
 * • Platform KPIs
 * • Monthly Growth
 * • Property Trends
 * • Lead Analytics
 * • Top Performing Agents
 *
 * ==========================================================
 */

import { useEffect, useState } from "react";

import {

  TrendingUp,

  Home,

  Users,

  BarChart3,

} from "lucide-react";

import analyticsService from "../../services/analyticsService";

const AdminAnalytics = () => {

  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const [

    summary,

    setSummary,

  ] = useState({

    totalProperties: 0,

    totalLeads: 0,

    conversionRate: 0,

    monthlyGrowth: 0,

  });

  /*
  ==========================================================
  MONTHLY REPORT
  ==========================================================
  */

  const [

    monthlyData,

    setMonthlyData,

  ] = useState([]);

  /*
  ==========================================================
  TOP AGENTS
  ==========================================================
  */

  const [

    topAgents,

    setTopAgents,

  ] = useState([]);

  /*
  ==========================================================
  UI
  ==========================================================
  */

  const [

    loading,

    setLoading,

  ] = useState(true);

/*
==========================================================
LOAD ANALYTICS
==========================================================
*/

const loadAnalytics = async () => {

  try {

    setLoading(true);

    /*
    ======================================================
    ANALYTICS ENDPOINT
    ======================================================
    */

    const response =

      await analyticsService.getDashboardAnalytics();

    /*
    Expected Backend

    {

      summary:{},

      monthlyData:[],

      topAgents:[]

    }

    */

    const data =

      response || {};

    /*
    ======================================================
    SUMMARY
    ======================================================
    */

    setSummary({

      totalProperties:

        data.summary?.totalProperties ||

        0,

      totalLeads:

        data.summary?.totalLeads ||

        0,

      conversionRate:

        data.summary?.conversionRate ||

        0,

      monthlyGrowth:

        data.summary?.monthlyGrowth ||

        0,

    });

    /*
    ======================================================
    MONTHLY REPORT
    ======================================================
    */

    setMonthlyData(

      data.monthlyData || []

    );

    /*
    ======================================================
    TOP AGENTS
    ======================================================
    */

    setTopAgents(

      data.topAgents || []

    );

  } catch (error) {

    console.error(

      "Unable to load analytics",

      error

    );

  } finally {

    setLoading(false);

  }

};

/*
==========================================================
INITIAL LOAD
==========================================================
*/

useEffect(() => {

  loadAnalytics();

}, []);

/*
==========================================================
SUMMARY CARDS
==========================================================
*/

const dashboardCards = [

  {

    title: "Properties",

    value: summary.totalProperties,

    icon: Home,

  },

  {

    title: "Leads",

    value: summary.totalLeads,

    icon: Users,

  },

  {

    title: "Conversion Rate",

    value: `${summary.conversionRate}%`,

    icon: TrendingUp,

  },

  {

    title: "Monthly Growth",

    value: `${summary.monthlyGrowth}%`,

    icon: BarChart3,

  },

];

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {

    return (

      <div className="flex items-center justify-center py-32">

        <p className="text-muted-foreground">

          Loading analytics...

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

    <section className="space-y-10">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div>

        <h1 className="text-3xl font-bold">

          Platform Analytics

        </h1>

        <p className="text-muted-foreground">

          Monitor platform performance,
          growth and business intelligence.

        </p>

      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {dashboardCards.map((card) => {

          const Icon = card.icon;

          return (

            <div

              key={card.title}

              className="rounded-xl border bg-card p-6"

            >

              <div className="mb-4 flex items-center justify-between">

                <Icon className="h-7 w-7 text-primary" />

                <span className="text-3xl font-bold">

                  {card.value}

                </span>

              </div>

              <h3 className="font-semibold">

                {card.title}

              </h3>

            </div>

          );

        })}

      </div>

      {/* ======================================================
          MONTHLY PERFORMANCE
      ====================================================== */}

      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">

          Monthly Performance

        </h2>

        <div className="rounded-xl border bg-card p-6">

          {monthlyData.length === 0 ? (

            <p className="text-muted-foreground">

              No analytics available.

            </p>

          ) : (

            <div className="space-y-4">

              {monthlyData.map((month) => (

                <div

                  key={month.month}

                  className="flex items-center justify-between rounded-lg border p-4"

                >

                  <span className="font-medium">

                    {month.month}

                  </span>

                  <div className="flex gap-8 text-sm">

                    <span>

                      Properties:

                      {" "}

                      <strong>

                        {month.properties}

                      </strong>

                    </span>

                    <span>

                      Leads:

                      {" "}

                      <strong>

                        {month.leads}

                      </strong>

                    </span>

                    <span>

                      Sales:

                      {" "}

                      <strong>

                        {month.sales}

                      </strong>

                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* ======================================================
          TOP AGENTS
      ====================================================== */}

      <section className="space-y-4">

        <h2 className="text-2xl font-semibold">

          Top Performing Agents

        </h2>

        <div className="rounded-xl border bg-card">

          {topAgents.length === 0 ? (

            <p className="p-6 text-muted-foreground">

              No agent statistics available.

            </p>

          ) : (

            <div className="divide-y">

              {topAgents.map((agent, index) => (

                <div

                  key={agent._id}

                  className="flex items-center justify-between p-5"

                >

                  <div>

                    <h3 className="font-medium">

                      #{index + 1}{" "}

                      {agent.name}

                    </h3>

                    <p className="text-sm text-muted-foreground">

                      {agent.email}

                    </p>

                  </div>

                  <div className="text-right">

                    <p className="font-semibold">

                      {agent.sales} Sales

                    </p>

                    <p className="text-sm text-muted-foreground">

                      {agent.properties} Listings

                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* ======================================================
          FUTURE AI INSIGHTS
      ====================================================== */}

      <section className="rounded-xl border bg-card p-6">

        <h2 className="mb-4 text-2xl font-semibold">

          AI Business Insights

        </h2>

        <div className="space-y-3 text-muted-foreground">

          <p>

            • Identify emerging property demand
            trends.

          </p>

          <p>

            • Predict future lead conversion
            rates.

          </p>

          <p>

            • Recommend high-performing
            marketing channels.

          </p>

          <p>

            • Highlight underperforming regions
            requiring attention.

          </p>

        </div>

      </section>

    </section>

  );

};

export default AdminAnalytics;