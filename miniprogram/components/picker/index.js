// components/picker/index.js
const defaultDates = []
const defaultHours = []
const defaultMinutes = Array(60)


Component({
  /**
   * 组件的属性列表
   */
  properties: {
    defaultValue:{
      type:Array,
      value:[],
      observer(newVal){
        if(newVal.length <= 0){ return }
        let defaultSelectValue = [
          this.data.picker_colum_1.findIndex(obj => obj.value === newVal[0]),
          this.data.picker_colum_2.findIndex(obj => obj.value === newVal[1]),
          this.data.picker_colum_3.findIndex(obj => obj.value === newVal[2]),
        ] 
        this.setData({  defaultSelectValue })
      }
    },
    cencalText:{
      type:String,
      value:'取消'
    },
    confirmText:{
      type:String,
      value:'发布预告'
    },
    is_close:{
      type:Boolean,
      value:false
    },
    title:{
      type:String,
      value:'请选择开播时间'
    },
    picker_colum_1:{
      type:Array,
      //生成今日开始的30天
      value: Array(30).fill().reduce((arr, num) => {
        let day = 24 * 60 * 60 * 1000
        let now = new Date(parseInt(Date.now() / day) * day + arr.length * day)
        let week = `星期${['一','二','三','四','五','六','天'][now.getDay()]}`
        let nowText = `${now.getMonth() + 1}月${now.getDate()}日 ${now.length <= 0 ? '今天' : week}`
        arr.push({ value:(new Date(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} 0:0:0`)).getTime(),text:nowText })
        return arr
      }, [])
    },
    picker_colum_2: {
      type: Array,
      value: Array(24).fill().reduce(arr => (arr.push({ value:arr.length,text:`${arr.length}点` }), arr), [])
    },
    picker_colum_3: {
      type: Array,
      value: Array(60).fill().reduce(arr => (arr.push({ value:arr.length,text:`${arr.length}分` }),arr),[])
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    selected:[],
    isCanSure:true,
    defaultSelectValue:[]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() {
      this.setData({ is_close: true })
      //事件通知
      this.triggerEvent("close", { component: this })
    },
    sure(){
      if (!this.data.isCanSure){ return }
      let selected = this.data.selected
      if (selected.length <= 0) {
        let hasDefault = this.data.defaultSelectValue.length > 0
        let col1 = hasDefault? this.data.defaultSelectValue[0] : 0
        let col2 = hasDefault? this.data.defaultSelectValue[1] : 0
        let col3 = hasDefault? this.data.defaultSelectValue[2] : 0
        selected = [
          this.data.picker_colum_1[col1],
          this.data.picker_colum_2[col2],
          this.data.picker_colum_3[col3]
        ] 
      }
      //通知事件
      this.triggerEvent("confirm", { value: selected,component:this })
    },
    changeValue(e){
      const val = e.detail.value
      this.setData({ selected: [
        this.data.picker_colum_1[val[0]],
        this.data.picker_colum_2[val[1]],
        this.data.picker_colum_3[val[2]]
      ] })
    },
    pickstart(){
      this.setData({ isCanSure:false })
    },
    pickend(){
      this.setData({ isCanSure:true })
    }
  },

  //组件生命周期
  lifetimes:{
    //在组件实例进入页面节点树时执行
    attached(){
      
    },
    //在组件实例被从页面节点树移除时执行
    detached(){}
  }
})
