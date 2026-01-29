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
    clientName: "Shivashish S.",
    profession: "Metabolikal Founder",
    duration: "90 days",
    result: "Went from 25% to 15% body fat. Lost 4kg fat",
    beforeImage: "/images/transformations/client1-before.jpg",
    afterImage: "/images/transformations/client1-after.jpg",
  },
  {
    id: "transformation-2",
    clientName: "Sandeep",
    profession: "Lead Engineer",
    duration: "3 months",
    result: "Gained 7.5kg",
    beforeImage: "/images/transformations/client2-before.jpg",
    afterImage: "/images/transformations/client2-after.jpg",
  },
  {
    id: "transformation-3",
    clientName: "Sumedha",
    profession: "IT Professional",
    duration: "16 weeks",
    result: "Lost 10kg",
    beforeImage: "/images/transformations/client3-before.jpg",
    afterImage: "/images/transformations/client3-after.jpg",
  },
  {
    id: "transformation-4",
    clientName: "Vikas",
    profession: "Doctor",
    duration: "14 weeks",
    result: "2.5 months",
    beforeImage: "/images/transformations/client4-before.jpg",
    afterImage: "/images/transformations/client4-after.jpg",
  },
  {
    id: "transformation-5",
    clientName: "Aishwarya",
    profession: "Doctor",
    duration: "6 months",
    result: "Lost 20kg",
    beforeImage: "/images/transformations/client5-before.jpg",
    afterImage: "/images/transformations/client5-after.jpg",
  },
  {
    id: "transformation-6",
    clientName: "Abhijeet",
    profession: "",
    duration: "20 weeks",
    result: "Lost 27kg",
    beforeImage: "/images/transformations/client6-before.jpg",
    afterImage: "/images/transformations/client6-after.jpg",
  },
  {
    id: "transformation-7",
    clientName: "Priti",
    profession: "",
    duration: "3 months",
    result: "Lost 6kg body fat",
    beforeImage: "/images/transformations/client7-before.jpg",
    afterImage: "/images/transformations/client7-after.jpg",
  },
];
