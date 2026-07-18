import type { Database } from "@/database/db";
import { faceApiDescriptorsMemoryDriver, storage } from "@/pkg/storage/storage";
import type { FaceApi } from "@/services/faceApi";

/**
 * @description
 */
export const refreshFaceApiDescriptorsStorage = async ({
  db,
  faceApi,
}: { db: Database; faceApi: FaceApi }): Promise<void> => {
  await storage.faceApiDescriptors.clear();

  const accountFaceDescriptors = await db.query.accounts.findMany({
    columns: {
      publicId: true,
      labelFaceDescriptorsString: true,
      companyId: true,
    },
    where: (t, o) => {
      return o.eq(t.role, "user");
    },
  });

  const arrPromise: Promise<void>[] = [];

  for (const afd of accountFaceDescriptors) {
    const key = afd.companyId ? `${afd.publicId}_${afd.companyId}` : afd.publicId;
    arrPromise.push(
      storage.faceApiDescriptors.setItemRaw(
        key,
        faceApi.loadLabeledFaceDescriptorsFromString(afd.labelFaceDescriptorsString),
      ),
    );
  }

  await Promise.all(arrPromise);
};

/**
 * @description get all cached face labeled descriptors
 */
export const fetchAllFaceApiLabeledDescriptors = async () => {
  return [
    ...(faceApiDescriptorsMemoryDriver.getInstance
      ? faceApiDescriptorsMemoryDriver.getInstance().values()
      : []),
  ];
};

/**
 * @description get company-specific face labeled descriptors
 */
export const fetchCompanyFaceApiLabeledDescriptors = async (companyId: string) => {
  const allDescriptors = await fetchAllFaceApiLabeledDescriptors();
  return allDescriptors.filter((descriptor) => descriptor.label.endsWith(`_${companyId}`));
};
