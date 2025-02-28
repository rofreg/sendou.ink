import PlusVotingHistoryPage, {
  PlusVotingHistoryPageProps,
} from "app/plus/components/PlusVotingHistoryPage";
import plusService from "app/plus/service";
import HeaderBanner from "components/layout/HeaderBanner";
import { GetStaticPaths, GetStaticProps } from "next";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<PlusVotingHistoryPageProps> = async ({
  params,
}) => {
  const getSlug = async () => {
    const slug = Array.isArray(params!.slug) ? params!.slug : [];
    if (slug.length === 3) {
      return slug;
    }

    if (slug.length > 0) {
      return [];
    }

    const mostRecent = await plusService.getMostRecentVotingWithResultsMonth();

    return ["1", mostRecent.year, mostRecent.month];
  };

  const [tier, year, month] = (await getSlug()).map((param) => Number(param));
  if (!tier) return { notFound: true };

  const [summaries, monthsWithData] = await Promise.all([
    plusService.getVotingSummariesByMonthAndTier({
      tier: tier as any,
      year,
      month,
    }),
    plusService.getDistinctSummaryMonths(),
  ]);

  if (!summaries.length) return { notFound: true };

  return {
    props: { summaries, monthsWithData },
  };
};

// @ts-expect-error
PlusVotingHistoryPage.header = (
  <HeaderBanner
    icon="plus"
    title="Voting History"
    subtitle="+1, +2 and +3 voting history since early 2020"
  />
);

export default PlusVotingHistoryPage;
