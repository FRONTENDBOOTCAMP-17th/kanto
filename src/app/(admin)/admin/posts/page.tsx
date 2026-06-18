import { getAdminPosts } from "@/services/admin/adminPosts";
import AdminPostsClient from "@/app/(admin)/admin/posts/_components/AdminPostsClient";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <div>
      <AdminPostsClient posts={posts} />
    </div>
  );
}
