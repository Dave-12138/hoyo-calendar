<script setup lang="ts">
import { computed } from 'vue';
import { DayData,  now, updateDates } from './data';
import { dateOrMonthToShow } from './util';

const props = defineProps<DayData>();
const isToday = computed(() => now.value.toLocaleDateString() == props.str);
const tomonth = computed(() => now.value.getMonth() + 1 == props.month);

const fes = computed(() => updateDates.value.filter(v => v.date == props.str));
</script>
<template>
  <td class="position-relative py-4" :class="{ today: isToday, tomonth, 'px-0': date == 1 }">
    <template v-if="fes.length > 0"><!-- 有内容 -->
      <div class="position-absolute start-50 bottom-0 translate-middle-x text-secondary"><!-- 底边显示日期 -->
        {{ dateOrMonthToShow({ day, date, month, str }) }}
      </div>
      <div class="position-absolute fs-small start-0 top-0 w-100 h-100">
        <div v-for="fe in fes">
          <span class="text-success">{{  fe.game ?? "" }}</span>
          <span>{{ fe.desc }}</span>
        </div>
      </div>
    </template>
    <div v-else class="fs-4 text-center"><!-- 没有内容 -->
      {{ dateOrMonthToShow({ day, date, month, str }) }}
    </div>
  </td>
</template>
<style lang="less">
.fs-small {
  @media (max-width:992px) {
    font-size: 10px;
  }
}

.today {
  background-image: url("./today.svg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

td:not(.tomonth) {
  opacity: 0.6;

  background-color: rgba(0, 0, 0, 0.2);
  // &::before {
  //     content: "";
  //     display: block;
  //     position: absolute;
  //     width: calc(100% + 1rem);
  //     height: calc(100% + 1rem);
  //     left: 50%;
  //     top: 50%;
  //     transform: translate(-50%, -50%);
  // }
}
</style>