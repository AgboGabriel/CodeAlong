export const defaultUser = {
  name: "Alex Rivera",
  isNew: true,
  progress: 0,
};

export function getUserDisplayName(currentUser) {
  return currentUser?.username || currentUser?.full_name || currentUser?.name || "Learner";
}
