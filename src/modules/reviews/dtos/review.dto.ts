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

export const responseFromMyReviews = (reviews: any[]) => {
  const lastReview = reviews[reviews.length - 1];

  return {
    data: reviews.map((review) => ({
      reviewId: review.id,
      rating: review.rating,
      content: review.content,
      createdAt: review.createdAt,
      store: {
        storeId: review.store.id,
        name: review.store.name,
        address: review.store.address,
      },
    })),

    pagination: {
      // 다음 요청에서 사용할 cursor
      // 리뷰가 없으면 null 반환
      cursor: lastReview ? lastReview.id : null,
    },
  };
};