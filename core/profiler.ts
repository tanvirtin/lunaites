interface Execution {
  name: string;
  calls: number;
  duration: number;
}

class Profiler {
  private static enabled = true;
  private static programStartedOn = performance.now();
  private static executionMap: Record<string, Execution> = {};

  static bench(
    // deno-lint-ignore ban-types
    target: Object,
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
      const name = `${target.constructor.name}.${methodName}`;

      if (name in Profiler.executionMap) {
        const exec = Profiler.executionMap[name];

        exec.calls += 1;
        exec.duration += duration;
      } else {
        Profiler.executionMap[name] = {
          name,
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
