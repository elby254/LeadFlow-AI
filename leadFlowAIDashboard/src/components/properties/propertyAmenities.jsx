/**
 * ==========================================================
 *
 * PURPOSE
 * ----------------------------------------------------------
 * Allows an agent to select amenities available
 * for a property.
 *
 * Used By
 * ----------------------------------------------------------
 * • PropertyForm
 *
 * Backend
 * ----------------------------------------------------------
 * PropertyAmenity Model
 *
 * ==========================================================
 */

const AVAILABLE_AMENITIES = [

  "Swimming Pool",

  "Gym",

  "Children's Playground",

  "Club House",

  "Community Hall",

  "Borehole",

  "Backup Generator",

  "Water Tank",

  "High Speed Lift",

  "CCTV",

  "24/7 Security",

  "Electric Fence",

  "Fibre Internet",

  "Garbage Collection",

  "Ample Parking",

  "Visitor Parking",

  "Pet Friendly",

  "Wheelchair Access",

];

const PropertyAmenities = ({

  value = [],

  onChange,

}) => {

  /*
  ==========================================================
  TOGGLE AMENITY
  ==========================================================
  */

  const toggleAmenity = (amenity) => {

    const exists = value.includes(amenity);

    if (exists) {

      onChange(

        value.filter(

          (item) => item !== amenity

        )

      );

      return;

    }

    onChange([

      ...value,

      amenity,

    ]);

  };

  return (

    <section className="rounded-xl border bg-card p-6 space-y-6">

      <div>

        <h3 className="text-lg font-semibold">

          Property Amenities

        </h3>

        <p className="text-sm text-muted-foreground">

          Select every amenity available for
          this property.

        </p>

      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

        {AVAILABLE_AMENITIES.map((amenity) => {

          const selected =
            value.includes(amenity);

          return (

            <button

              key={amenity}

              type="button"

              onClick={() =>
                toggleAmenity(amenity)
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

                {amenity}

              </span>

            </button>

          );

        })}

      </div>

      {/* Helper */}

      <div className="rounded-lg border bg-muted/40 p-4">

        <p className="text-sm text-muted-foreground">

          Amenities help LeadFlow AI match buyers
          and tenants with suitable properties,
          improve search filtering, and generate
          more accurate recommendations.

        </p>

      </div>

    </section>

  );

};

export default PropertyAmenities;