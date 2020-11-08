import { Box, Button, Divider } from "@chakra-ui/core";
import { t, Trans } from "@lingui/macro";
import { PrismaClient } from "@prisma/client";
import Breadcrumbs from "components/common/Breadcrumbs";
import Markdown from "components/common/Markdown";
import AvatarWithInfo from "components/u/AvatarWithInfo";
import ProfileModal from "components/u/ProfileModal";
import { getFullUsername } from "lib/strings";
import useUser from "lib/useUser";
import { GetStaticPaths, GetStaticProps } from "next";
import {
  getUserByIdentifier,
  GetUserByIdentifierData,
} from "prisma/queries/getUserByIdentifier";
import { useState } from "react";
import useSWR from "swr";

const prisma = new PrismaClient();

// FIXME: should try to make it so that /u/Sendou and /u/234234298348 point to the same page
export const getStaticPaths: GetStaticPaths = async () => {
  const users = await prisma.user.findMany({ include: { profile: true } });
  return {
    paths: users.flatMap((u) =>
      u.profile?.customUrlPath
        ? [
            { params: { identifier: u.discordId } },
            { params: { identifier: u.profile.customUrlPath } },
          ]
        : { params: { identifier: u.discordId } }
    ),
    fallback: true,
  };
};

interface Props {
  user: GetUserByIdentifierData;
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const user = await getUserByIdentifier(prisma, params!.identifier as string);

  //const isCustomUrl = isNaN(Number(params!.identifier))

  return {
    props: {
      user,
    },
    revalidate: 1,
    notFound: !user,
    //redirect: isCustomUrl ? { destination: "" } : undefined,
  };
};

const ProfilePage = (props: Props) => {
  const [showModal, setShowModal] = useState(false);

  const [loggedInUser] = useUser();
  const { data: user } = useSWR<GetUserByIdentifierData>(
    () => {
      // no need to load user if it's not the same as currently logged in user
      const userId = props.user?.id;
      if (!!userId && userId === loggedInUser?.id) return null;

      return `/api/users/${userId}`;
    },
    { initialData: props.user }
  );

  // same as router.isFallback
  // FIXME: return spinner
  if (!user) return null;

  return (
    <>
      <Breadcrumbs
        pages={[
          { name: t`Users`, link: "/u" },
          { name: getFullUsername(user) },
        ]}
      />
      <AvatarWithInfo user={user} />
      {loggedInUser?.id === user.id && (
        <Button onClick={() => setShowModal(true)}>
          <Trans>Edit profile</Trans>
        </Button>
      )}
      {showModal && (
        <ProfileModal onClose={() => setShowModal(false)} user={user} />
      )}
      <Divider my="2em" />
      {user.profile?.bio && (
        <Box>
          <Markdown value={user.profile.bio} />
        </Box>
      )}
    </>
  );
};

export default ProfilePage;
