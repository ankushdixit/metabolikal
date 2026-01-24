/**
 * Before/After Transformation Data
 *
 * Contains client transformation data for the before/after carousel.
 * Images should be placed in public/images/transformations/
 */

export interface BeforeAfterTransformation {
  id: string;
  clientName: string;
  profession: string;
  duration: string;
  result: string;
  beforeImage: string;
  afterImage: string;
}

/**
 * Transformation data for the Before/After carousel.
 *
 * NOTE: Image paths are placeholders. Replace with actual client images when available.
 * Images should be:
 * - 600x800px (3:4 portrait aspect ratio)
 * - JPG format
 * - Similar lighting/background in before and after
 * - Professional quality
 */
export const TRANSFORMATIONS: BeforeAfterTransformation[] = [
  {
    id: "transformation-1",
    clientName: "Rajesh K.",
    profession: "Startup Founder",
    duration: "12 weeks",
    result: "Lost 14kg while running a startup",
    beforeImage: "/images/transformations/client1-before.jpg",
    afterImage: "/images/transformations/client1-after.jpg",
  },
  {
    id: "transformation-2",
    clientName: "Amit S.",
    profession: "Tech Executive",
    duration: "16 weeks",
    result: "Dropped 3 sizes and gained energy",
    beforeImage: "/images/transformations/client2-before.jpg",
    afterImage: "/images/transformations/client2-after.jpg",
  },
  {
    id: "transformation-3",
    clientName: "Priya M.",
    profession: "Investment Banker",
    duration: "10 weeks",
    result: "Lost 8kg despite 80-hour weeks",
    beforeImage: "/images/transformations/client3-before.jpg",
    afterImage: "/images/transformations/client3-after.jpg",
  },
  {
    id: "transformation-4",
    clientName: "Vikram P.",
    profession: "Senior Consultant",
    duration: "14 weeks",
    result: "Transformed body composition completely",
    beforeImage: "/images/transformations/client4-before.jpg",
    afterImage: "/images/transformations/client4-after.jpg",
  },
  {
    id: "transformation-5",
    clientName: "Ananya R.",
    profession: "Healthcare Executive",
    duration: "12 weeks",
    result: "Lost 10kg and reversed pre-diabetes",
    beforeImage: "/images/transformations/client5-before.jpg",
    afterImage: "/images/transformations/client5-after.jpg",
  },
  {
    id: "transformation-6",
    clientName: "Suresh N.",
    profession: "Managing Director",
    duration: "20 weeks",
    result: "Lost 18kg and off blood pressure meds",
    beforeImage: "/images/transformations/client6-before.jpg",
    afterImage: "/images/transformations/client6-after.jpg",
  },
];
