class Profiler {
  private static programStartedOn = performance.now();
  private static enabled = !!Deno.env.get("LUNAITES_ENABLE_PROFILING");
  private static executionMap: Record<string, number> = {};

  static bench(
    _target: unknown,
    methodName: string,
    descriptor: PropertyDescriptor,
  ) {
    if (!Profiler.enabled) {
      return descriptor;
    }

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const start = performance.now();
      const result = originalMethod.apply(this, args);
      const finish = performance.now();

      const executionTime = finish - start;

      if (methodName in Profiler.executionMap) {
        Profiler.executionMap[methodName] += executionTime;
      } else {
        Profiler.executionMap[methodName] = executionTime;
      }

      return result;
    };

    return descriptor;
  }

  static dump() {
    console.info(`Parser took ${performance.now() - this.programStartedOn}ms`);
    console.info(this.executionMap);
  }
}

export { Profiler };
