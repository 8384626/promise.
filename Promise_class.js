
//  自定义的Promise模块
(function (window) {
  class Promise {
    constructor(excutor) {
      const that = this
      //给Promise对象指定status属性,初始值为penging
      that.status = 'pending'
      //给Prommise对象制定一个用于存储数据的属性
      that.data = undefined
      //给每个元素的结构:{onResolved(){},onRejected(){}}
      that.callbacks = []

      function resolve (value) {
        //如果当前状态不是pending,直接结束
        if (that.status !== 'pending') {
          return
        }
        //将状态该为resolved
        that.status = 'resolved'
        //保存value数据
        that.data = value
        //如有待执行的callback函数,立即异步执行回调
        if (that.callbacks.lengh > 0) {
          setTimeout(() => {
            //放入队列中执行所有成功的回调
            that.callbacks.forEach((calbacksObj) => {
              calbacksObj.onResolved(value)
            })
          })
        }
      }

      function reject (reason) {
        //如果当前状态不是pending,直接结束
        if (that.status !== 'pending') {
          return
        }
        //将状态该为resolved
        that.status = 'rejected'
        //保存value数据
        that.data = reason
        //如有待执行的callback函数,立即异步执行回调
        if (that.callbacks.lengh > 0) {
          setTimeout(() => {
            //放入队列中执行所有成功的回调
            that.callbacks.forEach((calbacksObj) => {
              calbacksObj.onResolved(reason)
            })
          })
        }
      }

      //立即同步执行执行器函数
      try {
        excutor(resolve, reject)
      } catch (error) {
        reject(error)
      }
    }
    // Promise原型对象的then()
    //  指定成功或者失败的回调函数 函数的返回值为一个新的Promise对象
    then = function (onResolved, onRejected) {

      function handle (callback) {
        /* 
           返回promise的结果由onResolved/onRejected执行结果决定
           1.抛出异常,返回promise的结果为失败,reason为异常
           2.返回的是promise,返回promise的结果就是这个结果
           3.返回的不是promise,返回的promise为成功 ,value就是返回值
           */
        try {
          const result = onResolved(that.data)
          if (result instanceof Promise) {
            // 2.返回的是promise,返回promise的结果就是这个结果
            result.then(resolve, reject)
          } else {
            // 3.返回的不是promise,返回的promise为成功 ,value就是返回值
            resolve(result)
          }
        } catch (error) { // 1.抛出异常,返回promise的结果为失败,reason为异常
          reject(error)
        }
      }
      const that = this
      //指定回调函数的默认值
      onResolved = typeof onResolved === 'function' ? onResolved : value => value
      onRejected = typeof onRejected === 'function' ? onRejected : resolve => { throw reason }
      return new Promise((resolve, reject) => {
        // 当前Promise是resolved
        if (that.status == 'resolved') {
          //立即异步执行成功的回调
          setTimeout(() => {
            handle(onResolved);
          })
        } else if (that.status == 'reject') {
          //  当前Promise是rejected
          //立即异步执行失败的回调
          setTimeout(() => {
            handle(onRejected);
          })
        } else {
          //当前promise的状态是pending
          //将成功和失败的回调保存到callbacks容器中缓存起来
          that.callbacks.push({
            onResolved () {
              handle(onResolved)
            },
            onRejected () {
              handle(onRejected)
            }
          })

        }

      })
    }

    //  Promise原型原型对象catch()
    //  指定失败的回调函数 函数的返回值为一个新的Promise对象
    catch = function (onRejected) {
      return this.then(undefined, onRejected)
    }

    // Promise函数对象resolve方法
    //  返回一个成功的Promise 成功值为value
    static resolve = function (value) {
      // 返回一个成功/失败的promise
      return new Promise((resolve, reject) => {
        //value是promise
        if (value instanceof Promise) {//使用value 的结果作为Promise的结果
          value.then(resolve, reject)
        } else {
          //value不是promise =>promise变为成功,数据是value
          resolve(value)
        }
      })
    }

    // Promise函数对象reject方法
    //  返回一个指定指定reason的失败promise
    static reject = function (reason) {
      // 返回一个失败的promise
      return new Promise((resolve, reject) => {
        reject(reason)
      })
    }

    // Promise函数对象all方法
    //返回一个promise
    // 只有当所有promise都成功时才成功,否则只要一个失败就失败
    static all = function (promises) {
      const arrs = new Array(promises.lengh) //用来保存所有成功的value的数组
      //用来保存成功的promise的数量
      let resolveCound = 0;
      //返回一个新的promise
      return new Promise((resolve, reject) => {
        // 便利promise获取每个promise的结果
        promises.forEach((p, index) => {
          Promise.resolve(p).then(
            value => {
              resolveCound++ //成功的数量加1
              //p成功了,将成功的value保存到arrs
              arrs[index] = value
              //如果全部成功了 ,将return 的promise改为成功
              if (resolveCound === promises.lengh) {
                resolve(arrs)
              }
            },
            reason => {//只要有一个失败了,return的promise就失败
              reject(reason)
            }
          )
        })
      })
    }

    // Promise函数对象race方法
    // 返回一个Promise 结果由第一个完成的Promise决定
    static race = function (promises) {
      //返回一个promise
      return new Promise((resolve, reject) => {
        promises.forEach((p, index) => {
          Promise.resolve(p).then(
            value => {
              //一旦有成功了,将return变为成功
              resolve(value)
            },
            reason => {
              //一旦有失败,将return变为失败
              reject(reason)
            }
          )
        })
      })
    }
  }
  //向外暴露Promise函数
  window.Promise = Promise
})(Window)
