export interface ContentType {
  id: number;
  name: string;
  allowsFileUpload: boolean;
  isAggregated: boolean;
}

export const CONTENT_TYPES: ContentType[] = [
  {
    id: 1,
    name: "Interactive Contents",
    allowsFileUpload: false,
    isAggregated: false,
  },
  {
    id: 2,
    name: "Motion Videos",
    allowsFileUpload: true,
    isAggregated: false,
  },
  {
    id: 3,
    name: "Brochures",
    allowsFileUpload: true,
    isAggregated: true,
  },
  {
    id: 4,
    name: "Posters",
    allowsFileUpload: true,
    isAggregated: true,
  },
  {
    id: 5,
    name: "Screen Savers",
    allowsFileUpload: true,
    isAggregated: true,
  },
  {
    id: 6,
    name: "Games",
    allowsFileUpload: false,
    isAggregated: false,
  },
  {
    id: 7,
    name: "Documents",
    allowsFileUpload: true,
    isAggregated: false,
  },
  {
    id: 8,
    name: "Misc",
    allowsFileUpload: true,
    isAggregated: true,
  },
  {
    id: 9,
    name: "VR Games",
    allowsFileUpload: false,
    isAggregated: false,
  },
];

export const NON_AGGREGATED_TYPES = CONTENT_TYPES.filter((t) => !t.isAggregated);
export const AGGREGATED_TYPES = CONTENT_TYPES.filter((t) => t.isAggregated);
