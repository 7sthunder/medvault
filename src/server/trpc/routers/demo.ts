import { publicProcedure, router } from "@/server/trpc/trpc";
import * as demoService from "@/server/domain/demo/service";
import {
  applyScenarioSchema,
  setTimeSchema,
  simulateActionSchema,
} from "@/shared/validations/demo";

export const demoRouter = router({
  getState: publicProcedure.query(async ({ ctx }) => {
    const demoUser = await demoService.getDemoUser(ctx.db);
    const state = await demoService.getDemoState(ctx.db, demoUser.id);
    return {
      demoUser: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        timezone: demoUser.timezone,
      },
      state,
    };
  }),

  enter: publicProcedure.mutation(async ({ ctx }) => {
    return demoService.enterDemo(ctx.db);
  }),

  leave: publicProcedure.mutation(async () => {
    return demoService.leaveDemo();
  }),

  reset: publicProcedure.mutation(async ({ ctx }) => {
    return demoService.resetDemo(ctx.db);
  }),

  setTime: publicProcedure
    .input(setTimeSchema)
    .mutation(async ({ ctx, input }) => {
      const demoUser = await demoService.getDemoUser(ctx.db);
      return demoService.setTime(ctx.db, demoUser.id, input);
    }),

  simulate: publicProcedure
    .input(simulateActionSchema)
    .mutation(async ({ ctx, input }) => {
      const demoUser = await demoService.getDemoUser(ctx.db);
      return demoService.simulateAction(ctx.db, demoUser.id, input);
    }),

  applyScenario: publicProcedure
    .input(applyScenarioSchema)
    .mutation(async ({ ctx, input }) => {
      const demoUser = await demoService.getDemoUser(ctx.db);
      return demoService.applyScenario(ctx.db, demoUser.id, input);
    }),

  generateAlert: publicProcedure.mutation(async ({ ctx }) => {
    const demoUser = await demoService.getDemoUser(ctx.db);
    return demoService.generateCaregiverAlert(ctx.db, demoUser.id);
  }),

  generateInsight: publicProcedure.mutation(async ({ ctx }) => {
    const demoUser = await demoService.getDemoUser(ctx.db);
    return demoService.generateDemoInsight(ctx.db, demoUser.id);
  }),
});
