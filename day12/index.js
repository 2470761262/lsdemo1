/**
 *
 * 1. 等待
 * 2. 成功
 * 3. 失败
 *
 * 初始状态是等待.
 * 只要被更改过状态之后就不能在更改
 */
const PENDING = "PENDING";
const RELOVE = "RELOVE";
const REJECT = "REJECT";

class MyPromise {
  constructor(callback) {
    this.type = PENDING; // 初始是等待状态;
    /**
     * 是否执行过then
     * 如果在失败阶段返回的新MyPromise没有执行过then
     * 代表下一个then没有能力处理前一个MyPromise的错误
     * 将会提示没有处理错误
     */
    this.isUseThen = false;
    this.method = {
      success() {},
      error() {},
    };

    //call apply bind
    //主动去设置这个方法的this
    //这三个方法只能用在functioin的方法上 对于箭头函数不生效
    callback(this.resolve.bind(this), this.reject.bind(this));
  }

  //成功
  resolve(value) {
    setTimeout(() => {
      this.type = RELOVE;
      this.method.success(value);
    });
  }

  //失败
  reject(value) {
    setTimeout(() => {
      this.type = REJECT;
      this.method.error(value);
    });
  }
  /*
 如果对应的失败函数没有传递,
 那么将会继续报错传递下一层。
 直到将对应的错误处理
*/
  then(onRelove, onReject) {
   
    this.isUseThen = true;
    let children = new MyPromise((r, s) => {
      if (this.type == PENDING) {
        this.method.success = function (v) {
          try {
            let value = onRelove(v);
            if (value instanceof MyPromise) {
              value.then(r, s);
              return;
            }
            r(value);
          } catch (error) {
            s(error);
          }
        };
        this.method.error = function (v) {
          try {
            let value = onReject(v);
            if (value instanceof MyPromise) {
              value.then(r, s);
              return;
            } else {
              r(value);
            }
          } catch (error) {
            if (onReject == undefined) {
              //下一个promise没有能力处理这个错误
              if (!children.isUseThen) {
                console.error("Uncaught (in promise) " + v);
              } else {
                s(v);
              }
            } else {
              s(error);
            }
          }
        };
      }
    });

    return children;
  }

  static isResolve(value) {
    return new MyPromise((r) => {
      r(value);
    });
  }

  static isReject(value) {
    return new MyPromise((r, s) => {
      s(value);
    });
  }

  static all(array) {
    return new MyPromise((r, s) => {
      let result = [];
      let count = 0;
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        element.then(
          (value) => {
            result.push(value);
            count++;
            if (count === array.length - 1) {
              r(result);
            }
          },
          (value) => {
            s(index);
          }
        );
      }
    });
  }

  static race(array) {
    return new MyPromise((r, s) => {
      let result;
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        element.then((value) => {
          if (result == null) {
            result = value;
            r(result);
          }
        });
      }
    });
  }

  catch(onReject) {
    return this.then(function () {}, onReject);
  }

  finally(onRelove) {
    return this.then(onRelove, onRelove);
  }
}
