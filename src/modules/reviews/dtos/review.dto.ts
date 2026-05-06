export interface ReviewCreateRequest {
  rating: number;
  content: string;
}

export const bodyToReview = (
  body: ReviewCreateRequest,
  storeId: number
) => {
  return {
    storeId,
    rating: body.rating,
    content: body.content,
  };
};

export const responseFromReview = (review: any) => {
  return {
    reviewId: review.id,
    storeId: review.store_id,
    rating: review.rating,
    content: review.content,
  };
};