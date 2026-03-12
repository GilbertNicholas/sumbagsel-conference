export class ChildRowDto {
  id: string;
  childName: string;
  churchName: string;
  age: number;
  needsConsumption: boolean;
  parentName: string;
  registrationId: string;
  checkedInAt: string | null;
}

export class ChildrenResponseDto {
  total: number;
  rows: ChildRowDto[];
}
