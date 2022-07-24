interface Execution {
  name: string;
  calls: number;
  duration: number;
}

class Profiler {
  private static programStartedOn = performance.now();
  private static enabled = !!Deno.env.get("LUNAITES_ENABLE_PROFILING");
  private static executionMap: Record<string, Execution> = {};

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

      const duration = finish - start;

      if (methodName in Profiler.executionMap) {
        const exec = Profiler.executionMap[methodName];
        exec.calls += 1;
        exec.duration += duration;
      } else {
        Profiler.executionMap[methodName] = {
          name: methodName,
          calls: 1,
          duration,
        };
      }

      return result;
    };

    return descriptor;
  }

  static dump() {
    console.info(`Parser took ${performance.now() - this.programStartedOn}ms`);

    let executions = Object.values(this.executionMap);

    executions = executions.sort((a, b) => b.duration - a.duration);

    executions.forEach((e) => console.log(e));
  }
}

export { Profiler };
