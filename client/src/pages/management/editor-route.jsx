import { useParams, useSearch } from "@tanstack/react-router";
import ResourceEditor from "./resource-editor";
export function CreateResourceRoute() {
  const { section } = useParams({ strict: false }),
    { resource } = useSearch({ strict: false });
  return <ResourceEditor mode="create" resource={resource} section={section} />;
}
export function EditResourceRoute() {
  const { id, section } = useParams({ strict: false }),
    { resource } = useSearch({ strict: false });
  return (
    <ResourceEditor mode="edit" id={id} resource={resource} section={section} />
  );
}
