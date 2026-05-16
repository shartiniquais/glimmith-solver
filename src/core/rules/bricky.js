import { allVertexBorderDegrees } from "../boundary.js";

export const brickyRule = {
  id: "bricky",
  label: "Bricky",
  scope: "boundary_graph",
  implementationStatus: "ready",
  implemented: true,
  paramsSchema: {},

  addConstraints(model, context) {
    model.addSelectionValidator((selectedCandidates, state) => {
      if (!state?.complete) return true;
      return !allVertexBorderDegrees(selectedCandidates, context.puzzle).some((vertex) => vertex.degree === 4);
    });
  }
};
