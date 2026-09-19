/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Allows agents to assign property features.
 *
 * Stored In
 * ----------------------------------------------------------
 * PropertyFeature Collection
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 * • AI Recommendation Engine
 * • Property Search
 * • Property Details
 *
 * ==========================================================
 */

const AVAILABLE_FEATURES = [

  "Swimming Pool",

  "Gym",

  "Lift",

  "Borehole",

  "Backup Generator",

  "Electric Fence",

  "CCTV",

  "Gated Community",

  "Balcony",

  "Rooftop Terrace",

  "Garden",

  "Fibre Internet",

  "Air Conditioning",

  "Solar Water Heating",

  "Walk-in Closet",

  "DSQ",

];

const PropertyFeatures = ({

  value = [],

  onChange,

}) => {

  /*
  ==========================================================
  TOGGLE FEATURE
  ==========================================================
  */

  const toggleFeature = (feature) => {

    const exists = value.includes(feature);

    if (exists) {

      onChange(

        value.filter(

          (item) => item !== feature

        )

      );

      return;

    }

    onChange([

      ...value,

      feature,

    ]);

  };

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Property Features

        </h3>

        <p className="text-sm text-muted-foreground">

          Select every feature available in
          this property.

        </p>

      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

        {AVAILABLE_FEATURES.map((feature) => {

          const selected =
            value.includes(feature);

          return (

            <button

              key={feature}

              type="button"

              onClick={() =>
                toggleFeature(feature)
              }

              className={`

                rounded-lg
                border
                px-4
                py-3
                text-left
                transition-all

                ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                }

              `}

            >

              <span className="font-medium">

                {feature}

              </span>

            </button>

          );

        })}

      </div>

      {/* Helper */}

      <div className="rounded-lg border bg-muted/40 p-4">

        <p className="text-sm text-muted-foreground">

          Selected features improve LeadFlow AI's
          property search, recommendations and
          buyer matching by helping the AI compare
          listings against a lead's preferences.

        </p>

      </div>

    </section>

  );

};

export default PropertyFeatures;