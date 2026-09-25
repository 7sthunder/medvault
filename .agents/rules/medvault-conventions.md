# MedVault Development & Git Workflow Conventions

## 1. Git Workflow & Remote Branch Strategy
- **Target Branch**: When working on the `bala` track, always synchronize with `origin/bala` at `https://github.com/7sthunder/medvault.git`.
- **Git Author Identity**: Use:
  - Name: `Balakrishnan`
  - Email: `227793263+THEFOOL-SUDO@users.noreply.github.com`
- **Push Verification**: Verify remote permissions before pushing. If permissions change, verify direct remote push before falling back to fork workflow.

## 2. tRPC & Data Serialization Guardrails
- **Time String Parsing**: Client and server time utilities (`combineDateAndTime`) must gracefully handle ISO timestamp strings with seconds and milliseconds (`23:59:59.999`) using `cleanHhmm = hhmm.slice(0, 5)`.
- **Raw Fetch to tRPC**: When calling tRPC mutations via raw `fetch` (e.g. during onboarding or custom webhooks), always wrap the request body in `{ json: payload }` to satisfy the SuperJSON transformer.
- **Root Layout Context**: All client features using `api.*.useQuery` or `api.*.useMutation` require `<TRPCProvider>` in `src/app/layout.tsx`.

## 3. Base UI Compound Component Guardrails
- **MenuGroupContext / SelectGroupContext**: Avoid rendering `@base-ui/react` labels (`MenuPrimitive.GroupLabel`, `SelectPrimitive.GroupLabel`) outside their respective compound parents (`<Menu.Group>`, `<Select.Group>`). Render standard styled `div` elements for dropdown section headers to prevent runtime context missing errors.
