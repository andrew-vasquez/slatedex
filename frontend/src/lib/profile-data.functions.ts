import { createServerFn } from "@tanstack/react-start";
import { getPublicProfileByUsername } from "./profile-data.server";

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((data: { username: string }) => data)
  .handler(async ({ data }) => getPublicProfileByUsername(data.username));
