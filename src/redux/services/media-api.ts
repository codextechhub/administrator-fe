// Auth-gated media fetching. The backend serves /media/ behind JWT auth
// (core.views.MediaView), so a plain <img src> gets 401 - the browser sends no
// Authorization header. This endpoint fetches the bytes through RTK Query (whose
// prepareHeaders attaches the JWT), turns them into a local blob: URL, and caches
// it. Any image component (the school logo, favicon, …) renders the returned
// blob URL instead of the raw /media/ URL.

import { baseApi } from "./base-api";

export const mediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchAuthMedia: builder.query<string, string>({
      // mediaUrl is the absolute URL the backend built (host + /media/...).
      // fetchBaseQuery uses an absolute http(s) URL as-is (no baseUrl prefix).
      queryFn: async (mediaUrl, _api, _extra, baseQuery) => {
        const result = await baseQuery({
          url: mediaUrl,
          responseHandler: (r) => r.blob(),
        });
        if ("error" in result && result.error) return { error: result.error };
        return { data: URL.createObjectURL(result.data as Blob) };
      },
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useFetchAuthMediaQuery } = mediaApi;
