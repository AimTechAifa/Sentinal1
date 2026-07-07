import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

/** Legacy `/login` URL — forwards to Clerk sign-in. */
export default async function LoginRedirectPage({ searchParams }: Props) {
  const { next } = await searchParams;
  if (next) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
  }
  redirect("/sign-in");
}
