import type { NavigatorScreenParams } from "@react-navigation/native";

export type LearnStackParamList = {
  Home: undefined;
  LessonPlayer: { lessonId: string };
};

export type RootTabParamList = {
  Learn: NavigatorScreenParams<LearnStackParamList>;
  Reference: undefined;
  Record: undefined;
  About: undefined;
};
