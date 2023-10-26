type SuccessPayload<Payload> = { type: 'success'; payload: Payload };
type ErrorPayload = { type: 'error'; error: any; isRealErrorObject?: boolean };

export type ResultOrError<Payload = any> = SuccessPayload<Payload> | ErrorPayload;

const createSuccessPayload = <Payload = any>(payload: Payload): SuccessPayload<Payload> => ({ type: 'success', payload });

const createErrorPayload = (error: any): ErrorPayload => ({
  type: 'error',
  error: error instanceof Error ? error.stack : error,
  isRealErrorObject: error instanceof Error,
});

export const handlePromiseWithResultOrError = async <Payload = any>(
  handler: (() => Promise<Payload>) | Promise<Payload>
): Promise<ResultOrError<Payload>> => {
  try {
    const result = await (typeof handler === 'function' ? handler() : handler);
    return createSuccessPayload(result);
  } catch (error) {
    return createErrorPayload(error);
  }
};

export const wrapInputAsResultOrError = <Payload = any>(
  input: { payload: Payload } | { error: any }
): ResultOrError<Payload> => 'payload' in input ? createSuccessPayload(input.payload) : createErrorPayload(input.error);

export const unwrapResultOrError = <Payload = any, DoNotThrow extends boolean = false>(
  input: ResultOrError<Payload>,
  options: { doNotThrow?: DoNotThrow } = {}
): Payload | (DoNotThrow extends true ? ErrorPayload : never) => {
  if (input.type === 'success') return input.payload;

  const error = input.isRealErrorObject ? new Error(input.error) : input.error;
  if (options.doNotThrow) return error;
  throw error;
};
