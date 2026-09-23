export type Team = {
  id: string;
  name: string;
  uefaCoefficient?: number;
  elo?: number;
  gfLast10?: number;
  gaLast10?: number;
  xgForLast10?: number;
  xgAgainstLast10?: number;
};

export type Fixture = {
  id: string;
  homeId: string;
  awayId: string;
  stage: string;
  leg?: number;
  kickoff: string;
  status: string;
};

export type BracketTie = {
  id: string;
  homeId: string;
  awayId: string;
  stage: string;
};

export type MatchProb = {
  homeId: string;
  awayId: string;
  pHome: number;
  pDraw: number;
  pAway: number;
  topScorelines: { home: number; away: number; p: number }[];
  over25: number;
  under25: number;
  btts: number;
  lambdaHome?: number;
  lambdaAway?: number;
};

export type StageProb = {
  teamId: string;
  pQuarter: number;
  pSemi: number;
  pFinal: number;
  pTrophy: number;
};

export type Probabilities = {
  timestamp: string;
  reason: string;
  demo?: boolean;
  seed?: number;
  matches: MatchProb[];
  tournament: {
    stage: StageProb[];
    tieAdvance: Record<
      string,
      { homeId: string; awayId: string; pHomeAdvances: number }
    >;
    iterations?: number;
    seed?: number;
  };
};

export type UpdateEntry = {
  timestamp: string;
  teamId?: string;
  deltaPp?: number;
  reason: string;
};
