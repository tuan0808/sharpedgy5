
export class Week {
  week : number = 0
  month : string = ""
  startDate : Date
  endDate : Date

  constructor(week : number, startDate : Date, endDate : Date, month : string) {
    this.week = week;
    this.startDate = startDate
    this.endDate = endDate
    this.month = month;
  }

  getStartDay() {
    return this.startDate.getDay()
  }

  getEndDay() {
    return this.endDate.getDay()
  }
}
