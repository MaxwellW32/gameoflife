import { z } from "zod";

//normal types


const moveActionSchema = z.enum(["up", "down", "left", "right"])
export type moveActionType = z.infer<typeof moveActionSchema>


export const tileRulesSchema = z.record(
    z.string().min(1), moveActionSchema.array()
)
export type tileRulesType = z.infer<typeof tileRulesSchema>
